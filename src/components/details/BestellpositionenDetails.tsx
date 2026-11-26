import type { Bestellpositionen, Bestellungen, Speisekarte } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { usePermissions } from '@/lib/permissions';
import { displayNameOf } from '@/lib/journey/rules';

export interface BestellpositionenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Bestellpositionen;
  /** N:1-Ziel „Bestellungen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  bestellungenList: Bestellungen[];
  /** Klick auf die Bestellungen-Relation → overlay.push auf dessen Detail. */
  onOpenBestellungen?: (record: Bestellungen) => void;
  /** N:1-Ziel „Speisekarte": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  speisekarteList: Speisekarte[];
  /** Klick auf die Speisekarte-Relation → overlay.push auf dessen Detail. */
  onOpenSpeisekarte?: (record: Speisekarte) => void;
}

export function BestellpositionenDetails({
  record,
  bestellungenList,
  onOpenBestellungen,
  speisekarteList,
  onOpenSpeisekarte,
}: BestellpositionenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const bestellungTarget = bestellungenList.find(r => r.record_id === extractRecordId(record.fields.bestellung));
  const speiseTarget = speisekarteList.find(r => r.record_id === extractRecordId(record.fields.speise));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('bestellpositionen', 'anzahl')} value={record.fields.anzahl} format="text" />
        <RecordField label={fieldLabel('bestellpositionen', 'sonderwunsch')} value={record.fields.sonderwunsch} format="text" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('bestellpositionen', 'bestellung')}
          name={bestellungTarget ? (displayNameOf('bestellungen', bestellungTarget.fields as Record<string, unknown>) || '—') : '—'}
          meta={[bestellungTarget?.fields.besteller_lastname].filter(Boolean).join(' · ') || undefined}
          onClick={bestellungTarget && onOpenBestellungen ? () => onOpenBestellungen!(bestellungTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('bestellpositionen', 'speise')}
          name={speiseTarget ? (displayNameOf('speisekarte', speiseTarget.fields as Record<string, unknown>) || '—') : '—'}
          meta={[speiseTarget?.fields.nummer].filter(Boolean).join(' · ') || undefined}
          onClick={speiseTarget && onOpenSpeisekarte ? () => onOpenSpeisekarte!(speiseTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.BESTELLPOSITIONEN} recordId={record.record_id} readOnly={!perms.canWrite('bestellpositionen')} />
    </>
  );
}
