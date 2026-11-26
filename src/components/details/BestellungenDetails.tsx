import type { Bestellungen, Organisatoren, Bestellpositionen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';
import { displayNameOf } from '@/lib/journey/rules';

export interface BestellungenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Bestellungen;
  /** N:1-Ziel „Organisatoren": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  organisatorenList: Organisatoren[];
  /** Klick auf die Organisatoren-Relation → overlay.push auf dessen Detail. */
  onOpenOrganisatoren?: (record: Organisatoren) => void;
  /** 1:N „Bestellpositionen" (bestellung): VOLLE Liste — der Block filtert auf diesen Record. */
  bestellpositionenList: Bestellpositionen[];
  /** Zeilen-Klick → overlay.push auf das Bestellpositionen-Detail (nie der Edit-Dialog). */
  onOpenBestellpositionen: (record: Bestellpositionen) => void;
  /** Kontextuelles „+": öffnet den Bestellpositionen-Dialog mit diesem Record vorgesetzt. */
  onAddBestellpositionen?: () => void;
}

export function BestellungenDetails({
  record,
  organisatorenList,
  onOpenOrganisatoren,
  bestellpositionenList,
  onOpenBestellpositionen,
  onAddBestellpositionen,
}: BestellungenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const organisatorTarget = organisatorenList.find(r => r.record_id === extractRecordId(record.fields.organisator));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('bestellungen', 'besteller_firstname')} value={record.fields.besteller_firstname} format="text" />
        <RecordField label={fieldLabel('bestellungen', 'besteller_lastname')} value={record.fields.besteller_lastname} format="text" />
        <RecordField label={fieldLabel('bestellungen', 'bestelldatum')} value={record.fields.bestelldatum} format="date" />
        <RecordField label={fieldLabel('bestellungen', 'bemerkung')} value={record.fields.bemerkung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('bestellungen', 'zahlungsstatus')} value={record.fields.zahlungsstatus} format="pill" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('bestellungen', 'organisator')}
          name={organisatorTarget ? (displayNameOf('organisatoren', organisatorTarget.fields as Record<string, unknown>) || '—') : '—'}
          meta={[organisatorTarget?.fields.paypal_email].filter(Boolean).join(' · ') || undefined}
          onClick={organisatorTarget && onOpenOrganisatoren ? () => onOpenOrganisatoren!(organisatorTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('bestellpositionen')}
        items={bestellpositionenList.filter(r => extractRecordId(r.fields.bestellung) === record.record_id)}
        map={r => ({ name: displayNameOf('bestellpositionen', r.fields as Record<string, unknown>) || appLabel('bestellpositionen'), meta: undefined })}
        onOpen={onOpenBestellpositionen}
        onAdd={onAddBestellpositionen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.BESTELLUNGEN} recordId={record.record_id} readOnly={!perms.canWrite('bestellungen')} />
    </>
  );
}
