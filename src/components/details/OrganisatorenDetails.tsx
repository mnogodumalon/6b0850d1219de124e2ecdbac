import type { Organisatoren, Bestellungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';
import { displayNameOf, displayPart } from '@/lib/journey/rules';

export interface OrganisatorenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Organisatoren;
  /** 1:N „Bestellungen" (organisator): VOLLE Liste — der Block filtert auf diesen Record. */
  bestellungenList: Bestellungen[];
  /** Zeilen-Klick → overlay.push auf das Bestellungen-Detail (nie der Edit-Dialog). */
  onOpenBestellungen: (record: Bestellungen) => void;
  /** Kontextuelles „+": öffnet den Bestellungen-Dialog mit diesem Record vorgesetzt. */
  onAddBestellungen?: () => void;
}

export function OrganisatorenDetails({
  record,
  bestellungenList,
  onOpenBestellungen,
  onAddBestellungen,
}: OrganisatorenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('organisatoren', 'organisator_firstname')} value={record.fields.organisator_firstname} format="text" />
        <RecordField label={fieldLabel('organisatoren', 'organisator_lastname')} value={record.fields.organisator_lastname} format="text" />
        <RecordField label={fieldLabel('organisatoren', 'paypal_email')} value={record.fields.paypal_email} format="email" />
        <RecordField label={fieldLabel('organisatoren', 'zahlungshinweis')} value={record.fields.zahlungshinweis} format="longtext" className="md:col-span-2" />
      </RecordSection>

      <SatelliteSection
        title={appLabel('bestellungen')}
        items={bestellungenList.filter(r => extractRecordId(r.fields.organisator) === record.record_id)}
        map={r => ({ name: displayNameOf('bestellungen', r.fields as Record<string, unknown>) || appLabel('bestellungen'), meta: displayPart(r.fields.bestelldatum) })}
        onOpen={onOpenBestellungen}
        onAdd={onAddBestellungen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.ORGANISATOREN} recordId={record.record_id} readOnly={!perms.canWrite('organisatoren')} />
    </>
  );
}
