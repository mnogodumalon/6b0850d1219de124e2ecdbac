/**
 * EntityCrud — pre-generated CRUD + overlay plumbing for the dashboard.
 * Compose it; NEVER re-roll dialog state, submit handlers, an overlay stack
 * or a RecordOverlayHost in the page — this file owns all of it.
 *
 * API at a glance:
 *   const data = useDashboardData();
 *   const crud = useEntityCrud(data, {
 *     // optional — the ONE semantic slot on the overlay: the record's next
 *     // workflow step. Return undefined for types without one.
 *     footer: (top) => top.type === 'organisatoren'
 *       ? { label: …, onClick: () => … }
 *       : undefined,
 *   });
 *
 *   `top.type` is the SAME camelCase key as `crud.<entity>` — one spelling
 *   per entity, everywhere in this API.
 *   …
 *   crud.organisatoren.openCreate({ …defaults })   // create dialog, prefilled — defaults are
 *                                       // shape-tolerant: bare lookup keys / record ids are fine
 *   crud.organisatoren.openEdit(record)            // edit dialog (recordId + defaults wired)
 *   crud.organisatoren.openDetail(record)          // record overlay — pass the RAW record,
 *                                       // enrichment is resolved inside
 *   crud.overlay                         // RecordOverlayStack<OverlayItem> for drills:
 *                                       // push / pop / replace / close
 *   crud.enriched.organisatoren              // the display-ready array for EVERY entity —
 *                                       // Enriched* where relations exist, the raw array
 *                                       // otherwise. Reuse these; never call enrich*()
 *                                       // in the page, and never guess which entity has
 *                                       // one: they all do.
 *   {crud.surfaces}                      // render ONCE at the end of the page JSX:
 *                                       // all entity dialogs + the overlay host
 *
 * Built in (do NOT re-implement): optimistic update + Rückgängig counter-write
 * on edit, fetchAll-on-error, edit-from-overlay, and per-entity overlay bodies
 * (RecordHeader + <{Entity}Details> with every relation reachable and the
 * contextual "+" prefilled; list-field back-references additionally get a
 * "choose existing" picker that links an EXISTING record — built in, do not
 * re-roll). Drag writes (onEventDrop/onCardMove) stay YOURS:
 * optimistic setter first, PATCH in background, undoToast with counter-write.
 *
 * Overlay content per entity (the host renders these — you never compose
 * Details blocks yourself):
 *   organisatoren: organisator_firstname, organisator_lastname, paypal_email, zahlungshinweis  ·  ← bestellungen (list + contextual +)
 *   speisekarte: nummer, bezeichnung, kategorie, preis, beschreibung  ·  ← bestellpositionen (list + contextual +)
 *   bestellungen: besteller_firstname, besteller_lastname, bestelldatum, organisator, bemerkung, zahlungsstatus  ·  → organisatoren · ← bestellpositionen (list + contextual +)
 *   bestellpositionen: bestellung, speise, anzahl, sonderwunsch  ·  → bestellungen · → speisekarte
 */
import { useState, useMemo, type ReactNode } from 'react';
import type { Organisatoren, Speisekarte, Bestellungen, Bestellpositionen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, createRecordUrl } from '@/services/livingAppsService';
import { enrichBestellungen, enrichBestellpositionen } from '@/lib/enrich';
import type { EnrichedBestellungen, EnrichedBestellpositionen } from '@/types/enriched';
import { useDashboardData } from '@/hooks/useDashboardData';
import {
  useRecordOverlayStack, RecordOverlayHost, RecordHeader,
  type RecordOverlayStack,
} from '@/components/widgets/RecordView';
import { OrganisatorenDialog, type OrganisatorenDialogDefaults } from '@/components/dialogs/OrganisatorenDialog';
import { OrganisatorenDetails } from '@/components/details/OrganisatorenDetails';
import { SpeisekarteDialog, type SpeisekarteDialogDefaults } from '@/components/dialogs/SpeisekarteDialog';
import { SpeisekarteDetails } from '@/components/details/SpeisekarteDetails';
import { BestellungenDialog, type BestellungenDialogDefaults } from '@/components/dialogs/BestellungenDialog';
import { BestellungenDetails } from '@/components/details/BestellungenDetails';
import { BestellpositionenDialog, type BestellpositionenDialogDefaults } from '@/components/dialogs/BestellpositionenDialog';
import { BestellpositionenDetails } from '@/components/details/BestellpositionenDetails';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { t, appLabel } from '@/i18n';
import { undoToast } from '@/lib/polish';
import { usePermissions } from '@/lib/permissions';
import { toast } from 'sonner';
import { syncDoorsAfterWrite } from '@/lib/publicDoors';
import { displayNameOf, displayPart } from '@/lib/journey/rules';
import { formatDate } from '@/lib/formatters';

// The overlay union — one branch per entity, `record` typed the way the data
// flows: Enriched* where enrichment exists, the raw record type otherwise.
// The host resolves enrichment itself; pages pass raw records everywhere.
export type OverlayItem =
  | { type: 'organisatoren'; record: Organisatoren }
  | { type: 'speisekarte'; record: Speisekarte }
  | { type: 'bestellungen'; record: EnrichedBestellungen }
  | { type: 'bestellpositionen'; record: EnrichedBestellpositionen };

/** The useDashboardData() return — pass it in, never re-fetch inside. */
export type EntityCrudData = ReturnType<typeof useDashboardData>;

export interface EntityCrudOptions {
  /** Per-type overlay footer — the record's next workflow step. */
  /** The action may return a sentence — the reason the step was NOT taken; the overlay shows it under the button. */
  footer?: (top: OverlayItem) => ReactNode | { label: ReactNode; onClick: () => void | string | Promise<void | string> } | undefined;
  placement?: 'side' | 'center';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface EntityCrudApi<TRecord, TDefaults> {
  /** Open the create dialog, optionally prefilled (shape-tolerant defaults). */
  openCreate: (defaults?: TDefaults) => void;
  /** Open the edit dialog for a record (recordId + defaults are wired). */
  openEdit: (record: TRecord) => void;
  /** Open the record overlay (raw record is fine — enrichment resolved inside). */
  openDetail: (record: TRecord) => void;
  /** May the signed-in user create/change records of this list? (the
   *  platform's rights — show a „+ Neu“ only when true; openCreate/openEdit
   *  refuse with a notice otherwise). */
  canWrite: boolean;
}

export interface EntityCrud {
  /** The overlay stack for drills: push / pop / replace / close. */
  overlay: RecordOverlayStack<OverlayItem>;
  /** Render ONCE at the end of the page JSX — all dialogs + the overlay host. */
  surfaces: ReactNode;
  organisatoren: EntityCrudApi<Organisatoren, OrganisatorenDialogDefaults>;
  speisekarte: EntityCrudApi<Speisekarte, SpeisekarteDialogDefaults>;
  bestellungen: EntityCrudApi<Bestellungen, BestellungenDialogDefaults>;
  bestellpositionen: EntityCrudApi<Bestellpositionen, BestellpositionenDialogDefaults>;
  /** The display-ready array per entity: Enriched* where an enrich function
   *  exists, the raw array otherwise. One key per entity so no page has to
   *  know which is which. Reuse these; never re-enrich in the page. */
  enriched: { organisatoren: Organisatoren[]; speisekarte: Speisekarte[]; bestellungen: EnrichedBestellungen[]; bestellpositionen: EnrichedBestellpositionen[] };
}

export function useEntityCrud(data: EntityCrudData, options?: EntityCrudOptions): EntityCrud {
  const overlay = useRecordOverlayStack<OverlayItem>();
  // the platform's rights of the signed-in user (lib/permissions.ts) — unknown = allowed
  const perms = usePermissions();
  const refuse = () => { toast.error(t('perm_denied_title'), { description: t('perm_denied_desc') }); };
  const [organisatorenDialog, setOrganisatorenDialog] = useState<{ defaults?: OrganisatorenDialogDefaults; editing?: Organisatoren } | null>(null);
  const [speisekarteDialog, setSpeisekarteDialog] = useState<{ defaults?: SpeisekarteDialogDefaults; editing?: Speisekarte } | null>(null);
  const [bestellungenDialog, setBestellungenDialog] = useState<{ defaults?: BestellungenDialogDefaults; editing?: Bestellungen } | null>(null);
  const [bestellpositionenDialog, setBestellpositionenDialog] = useState<{ defaults?: BestellpositionenDialogDefaults; editing?: Bestellpositionen } | null>(null);
  const enrichedBestellungen = useMemo(() => enrichBestellungen(data.bestellungen, { organisatorenMap: data.organisatorenMap }), [data.bestellungen, data.organisatorenMap]);
  const enrichedBestellpositionen = useMemo(() => enrichBestellpositionen(data.bestellpositionen, { bestellungenMap: data.bestellungenMap, speisekarteMap: data.speisekarteMap }), [data.bestellpositionen, data.bestellungenMap, data.speisekarteMap]);

  function detailOrganisatoren(record: Organisatoren, push = false) {
    const item: OverlayItem = { type: 'organisatoren', record };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitOrganisatoren(fields: Organisatoren['fields']) {
    const editing = organisatorenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setOrganisatoren(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateOrganisatorenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('organisatoren')} — ${t('crud_updated')}`, async () => {
        data.setOrganisatoren(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateOrganisatorenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
      void syncDoorsAfterWrite('organisatoren', editing.record_id, fields as Record<string, unknown>);
    } else {
      const made = await LivingAppsService.createOrganisatorenEntry(fields);
      undoToast(`${appLabel('organisatoren')} — ${t('crud_created')}`);
      // EF-51: a new parent record gets its pair of doors right away (the record's own link)
      const madeId = (made as { id?: string; record_id?: string } | undefined)?.id ?? (made as { record_id?: string } | undefined)?.record_id;
      if (madeId) void syncDoorsAfterWrite('organisatoren', madeId, fields as Record<string, unknown>).then(r => { if (!r.ok) toast.error(r.message ? `${t('door_failed')}: ${r.message}` : t('door_failed_later')); });
      data.fetchAll();
    }
  }

  function detailSpeisekarte(record: Speisekarte, push = false) {
    const item: OverlayItem = { type: 'speisekarte', record };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitSpeisekarte(fields: Speisekarte['fields']) {
    const editing = speisekarteDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setSpeisekarte(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateSpeisekarteEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('speisekarte')} — ${t('crud_updated')}`, async () => {
        data.setSpeisekarte(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateSpeisekarteEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
      void syncDoorsAfterWrite('speisekarte', editing.record_id, fields as Record<string, unknown>);
    } else {
      const made = await LivingAppsService.createSpeisekarteEntry(fields);
      undoToast(`${appLabel('speisekarte')} — ${t('crud_created')}`);
      // EF-51: a new parent record gets its pair of doors right away (the record's own link)
      const madeId = (made as { id?: string; record_id?: string } | undefined)?.id ?? (made as { record_id?: string } | undefined)?.record_id;
      if (madeId) void syncDoorsAfterWrite('speisekarte', madeId, fields as Record<string, unknown>).then(r => { if (!r.ok) toast.error(r.message ? `${t('door_failed')}: ${r.message}` : t('door_failed_later')); });
      data.fetchAll();
    }
  }

  function detailBestellungen(record: Bestellungen, push = false) {
    const rec = enrichedBestellungen.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'bestellungen', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitBestellungen(fields: Bestellungen['fields']) {
    const editing = bestellungenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setBestellungen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateBestellungenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('bestellungen')} — ${t('crud_updated')}`, async () => {
        data.setBestellungen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateBestellungenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
      void syncDoorsAfterWrite('bestellungen', editing.record_id, fields as Record<string, unknown>);
    } else {
      const made = await LivingAppsService.createBestellungenEntry(fields);
      undoToast(`${appLabel('bestellungen')} — ${t('crud_created')}`);
      // EF-51: a new parent record gets its pair of doors right away (the record's own link)
      const madeId = (made as { id?: string; record_id?: string } | undefined)?.id ?? (made as { record_id?: string } | undefined)?.record_id;
      if (madeId) void syncDoorsAfterWrite('bestellungen', madeId, fields as Record<string, unknown>).then(r => { if (!r.ok) toast.error(r.message ? `${t('door_failed')}: ${r.message}` : t('door_failed_later')); });
      data.fetchAll();
    }
  }

  function detailBestellpositionen(record: Bestellpositionen, push = false) {
    const rec = enrichedBestellpositionen.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'bestellpositionen', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitBestellpositionen(fields: Bestellpositionen['fields']) {
    const editing = bestellpositionenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setBestellpositionen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateBestellpositionenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('bestellpositionen')} — ${t('crud_updated')}`, async () => {
        data.setBestellpositionen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateBestellpositionenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
      void syncDoorsAfterWrite('bestellpositionen', editing.record_id, fields as Record<string, unknown>);
    } else {
      const made = await LivingAppsService.createBestellpositionenEntry(fields);
      undoToast(`${appLabel('bestellpositionen')} — ${t('crud_created')}`);
      // EF-51: a new parent record gets its pair of doors right away (the record's own link)
      const madeId = (made as { id?: string; record_id?: string } | undefined)?.id ?? (made as { record_id?: string } | undefined)?.record_id;
      if (madeId) void syncDoorsAfterWrite('bestellpositionen', madeId, fields as Record<string, unknown>).then(r => { if (!r.ok) toast.error(r.message ? `${t('door_failed')}: ${r.message}` : t('door_failed_later')); });
      data.fetchAll();
    }
  }

  const surfaces = (
    <>
      <OrganisatorenDialog
        open={organisatorenDialog !== null}
        onClose={() => setOrganisatorenDialog(null)}
        onSubmit={submitOrganisatoren}
        defaultValues={organisatorenDialog?.defaults}
        recordId={organisatorenDialog?.editing?.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Organisatoren']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Organisatoren']}
      />
      <SpeisekarteDialog
        open={speisekarteDialog !== null}
        onClose={() => setSpeisekarteDialog(null)}
        onSubmit={submitSpeisekarte}
        defaultValues={speisekarteDialog?.defaults}
        recordId={speisekarteDialog?.editing?.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Speisekarte']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Speisekarte']}
      />
      <BestellungenDialog
        open={bestellungenDialog !== null}
        onClose={() => setBestellungenDialog(null)}
        onSubmit={submitBestellungen}
        defaultValues={bestellungenDialog?.defaults}
        recordId={bestellungenDialog?.editing?.record_id}
        organisatorenList={data.organisatoren}
        enablePhotoScan={AI_PHOTO_SCAN['Bestellungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Bestellungen']}
      />
      <BestellpositionenDialog
        open={bestellpositionenDialog !== null}
        onClose={() => setBestellpositionenDialog(null)}
        onSubmit={submitBestellpositionen}
        defaultValues={bestellpositionenDialog?.defaults}
        recordId={bestellpositionenDialog?.editing?.record_id}
        bestellungenList={data.bestellungen}
        speisekarteList={data.speisekarte}
        enablePhotoScan={AI_PHOTO_SCAN['Bestellpositionen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Bestellpositionen']}
      />
      <RecordOverlayHost
        overlay={overlay}
        placement={options?.placement}
        size={options?.size}
        footer={options?.footer}
        render={(top) => {
          if (top.type === 'organisatoren') {
            return (
              <>
                <RecordHeader title={displayNameOf('organisatoren', top.record.fields as Record<string, unknown>) || appLabel('organisatoren')} subtitle={undefined} />
                <OrganisatorenDetails
                  record={top.record}
                  bestellungenList={data.bestellungen}
                  onOpenBestellungen={(r) => detailBestellungen(r, true)}
                  onAddBestellungen={perms.canWrite('bestellungen') ? () => setBestellungenDialog({ defaults: { organisator: createRecordUrl(APP_IDS.ORGANISATOREN, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'speisekarte') {
            return (
              <>
                <RecordHeader title={displayNameOf('speisekarte', top.record.fields as Record<string, unknown>) || appLabel('speisekarte')} subtitle={undefined} />
                <SpeisekarteDetails
                  record={top.record}
                  bestellpositionenList={data.bestellpositionen}
                  onOpenBestellpositionen={(r) => detailBestellpositionen(r, true)}
                  onAddBestellpositionen={perms.canWrite('bestellpositionen') ? () => setBestellpositionenDialog({ defaults: { speise: createRecordUrl(APP_IDS.SPEISEKARTE, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'bestellungen') {
            return (
              <>
                <RecordHeader title={displayNameOf('bestellungen', top.record.fields as Record<string, unknown>) || appLabel('bestellungen')} subtitle={top.record.fields.bestelldatum ? formatDate(top.record.fields.bestelldatum) : undefined} />
                <BestellungenDetails
                  record={top.record}
                  organisatorenList={data.organisatoren}
                  onOpenOrganisatoren={(r) => detailOrganisatoren(r, true)}
                  bestellpositionenList={data.bestellpositionen}
                  onOpenBestellpositionen={(r) => detailBestellpositionen(r, true)}
                  onAddBestellpositionen={perms.canWrite('bestellpositionen') ? () => setBestellpositionenDialog({ defaults: { bestellung: createRecordUrl(APP_IDS.BESTELLUNGEN, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'bestellpositionen') {
            return (
              <>
                <RecordHeader title={displayNameOf('bestellpositionen', top.record.fields as Record<string, unknown>) || appLabel('bestellpositionen')} subtitle={undefined} />
                <BestellpositionenDetails
                  record={top.record}
                  bestellungenList={data.bestellungen}
                  onOpenBestellungen={(r) => detailBestellungen(r, true)}
                  speisekarteList={data.speisekarte}
                  onOpenSpeisekarte={(r) => detailSpeisekarte(r, true)}
                />
              </>
            );
          }
          return null;
        }}
        canEdit={(top) => {
          if (top.type === 'organisatoren') return perms.canWrite('organisatoren');
          if (top.type === 'speisekarte') return perms.canWrite('speisekarte');
          if (top.type === 'bestellungen') return perms.canWrite('bestellungen');
          if (top.type === 'bestellpositionen') return perms.canWrite('bestellpositionen');
          return true;
        }}
        onEdit={(top) => {
          overlay.close();
          if (top.type === 'organisatoren') setOrganisatorenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'speisekarte') setSpeisekarteDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'bestellungen') setBestellungenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'bestellpositionen') setBestellpositionenDialog({ editing: top.record, defaults: top.record.fields });
        }}
      />
    </>
  );

  return {
    overlay,
    surfaces,
    organisatoren: {
      openCreate: (defaults?: OrganisatorenDialogDefaults) => (perms.canWrite('organisatoren') ? setOrganisatorenDialog({ defaults }) : refuse()),
      openEdit: (record: Organisatoren) => (perms.canWrite('organisatoren') ? setOrganisatorenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Organisatoren) => detailOrganisatoren(record, false),
      canWrite: perms.canWrite('organisatoren'),
    },
    speisekarte: {
      openCreate: (defaults?: SpeisekarteDialogDefaults) => (perms.canWrite('speisekarte') ? setSpeisekarteDialog({ defaults }) : refuse()),
      openEdit: (record: Speisekarte) => (perms.canWrite('speisekarte') ? setSpeisekarteDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Speisekarte) => detailSpeisekarte(record, false),
      canWrite: perms.canWrite('speisekarte'),
    },
    bestellungen: {
      openCreate: (defaults?: BestellungenDialogDefaults) => (perms.canWrite('bestellungen') ? setBestellungenDialog({ defaults }) : refuse()),
      openEdit: (record: Bestellungen) => (perms.canWrite('bestellungen') ? setBestellungenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Bestellungen) => detailBestellungen(record, false),
      canWrite: perms.canWrite('bestellungen'),
    },
    bestellpositionen: {
      openCreate: (defaults?: BestellpositionenDialogDefaults) => (perms.canWrite('bestellpositionen') ? setBestellpositionenDialog({ defaults }) : refuse()),
      openEdit: (record: Bestellpositionen) => (perms.canWrite('bestellpositionen') ? setBestellpositionenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Bestellpositionen) => detailBestellpositionen(record, false),
      canWrite: perms.canWrite('bestellpositionen'),
    },
    enriched: { organisatoren: data.organisatoren, speisekarte: data.speisekarte, bestellungen: enrichedBestellungen, bestellpositionen: enrichedBestellpositionen },
  };
}
