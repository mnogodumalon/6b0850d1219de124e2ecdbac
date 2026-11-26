import type { EnrichedBestellpositionen, EnrichedBestellungen } from '@/types/enriched';
import type { Bestellpositionen, Bestellungen, Organisatoren, Speisekarte } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import { displayPart } from '@/lib/journey/rules';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => displayPart(r.fields[f])).filter(Boolean).join(' ').trim();
}

interface BestellungenMaps {
  organisatorenMap: Map<string, Organisatoren>;
}

export function enrichBestellungen(
  bestellungen: Bestellungen[],
  maps: BestellungenMaps
): EnrichedBestellungen[] {
  return bestellungen.map(r => ({
    ...r,
    organisatorName: resolveDisplay(r.fields.organisator, maps.organisatorenMap, 'organisator_firstname'),
  }));
}

interface BestellpositionenMaps {
  bestellungenMap: Map<string, Bestellungen>;
  speisekarteMap: Map<string, Speisekarte>;
}

export function enrichBestellpositionen(
  bestellpositionen: Bestellpositionen[],
  maps: BestellpositionenMaps
): EnrichedBestellpositionen[] {
  return bestellpositionen.map(r => ({
    ...r,
    bestellungName: resolveDisplay(r.fields.bestellung, maps.bestellungenMap, 'besteller_firstname'),
    speiseName: resolveDisplay(r.fields.speise, maps.speisekarteMap, 'bezeichnung'),
  }));
}
