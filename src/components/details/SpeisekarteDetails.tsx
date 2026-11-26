import type { Speisekarte, Bestellpositionen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';
import { displayNameOf } from '@/lib/journey/rules';

export interface SpeisekarteDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Speisekarte;
  /** 1:N „Bestellpositionen" (speise): VOLLE Liste — der Block filtert auf diesen Record. */
  bestellpositionenList: Bestellpositionen[];
  /** Zeilen-Klick → overlay.push auf das Bestellpositionen-Detail (nie der Edit-Dialog). */
  onOpenBestellpositionen: (record: Bestellpositionen) => void;
  /** Kontextuelles „+": öffnet den Bestellpositionen-Dialog mit diesem Record vorgesetzt. */
  onAddBestellpositionen?: () => void;
}

export function SpeisekarteDetails({
  record,
  bestellpositionenList,
  onOpenBestellpositionen,
  onAddBestellpositionen,
}: SpeisekarteDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('speisekarte', 'nummer')} value={record.fields.nummer} format="text" />
        <RecordField label={fieldLabel('speisekarte', 'bezeichnung')} value={record.fields.bezeichnung} format="text" />
        <RecordField label={fieldLabel('speisekarte', 'kategorie')} value={record.fields.kategorie} format="pill" />
        <RecordField label={fieldLabel('speisekarte', 'preis')} value={record.fields.preis} format="text" />
        <RecordField label={fieldLabel('speisekarte', 'beschreibung')} value={record.fields.beschreibung} format="longtext" className="md:col-span-2" />
      </RecordSection>

      <SatelliteSection
        title={appLabel('bestellpositionen')}
        items={bestellpositionenList.filter(r => extractRecordId(r.fields.speise) === record.record_id)}
        map={r => ({ name: displayNameOf('bestellpositionen', r.fields as Record<string, unknown>) || appLabel('bestellpositionen'), meta: undefined })}
        onOpen={onOpenBestellpositionen}
        onAdd={onAddBestellpositionen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.SPEISEKARTE} recordId={record.record_id} readOnly={!perms.canWrite('speisekarte')} />
    </>
  );
}
