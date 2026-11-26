import { lookupLabel } from '@/i18n';

// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
/** A raw record URL (applookup reference). NEVER render this directly
 *  in JSX — it is a URL, not a display value. Show the enriched `*Name`
 *  field or resolve it via the entity map instead. Assignable to/from
 *  string everywhere; the `& {}` keeps the alias NAME visible in tsc
 *  error messages (a plain primitive alias gets normalized away). */
export type RecordUrl = string & {};
export type GeoLocation = { lat: number; long: number; info?: string };

export type AttachmentType = 'file' | 'note' | 'url' | 'json';
export interface Attachment {
  id: string;
  type: AttachmentType;
  label: string | null;
  value: string | null;
  active: boolean;
  createdat?: string | null;
  updatedat?: string | null;
}

export interface AttachmentInput {
  type: AttachmentType;
  label?: string;
  value: string;
  active?: boolean;
}

export interface Organisatoren {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    organisator_firstname?: string;
    organisator_lastname?: string;
    paypal_email?: string;
    zahlungshinweis?: string;
  };
}

export interface Speisekarte {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    nummer?: string;
    bezeichnung?: string;
    kategorie?: LookupValue;
    preis?: number;
    beschreibung?: string;
  };
}

export interface Bestellungen {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    besteller_firstname?: string;
    besteller_lastname?: string;
    bestelldatum?: string; // Format: YYYY-MM-DD oder ISO String
    organisator?: RecordUrl; // applookup -> URL zu 'Organisatoren' Record
    bemerkung?: string;
    zahlungsstatus?: LookupValue;
  };
}

export interface Bestellpositionen {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    bestellung?: RecordUrl; // applookup -> URL zu 'Bestellungen' Record
    speise?: RecordUrl; // applookup -> URL zu 'Speisekarte' Record
    anzahl?: number;
    sonderwunsch?: string;
  };
}

export const APP_IDS = {
  ORGANISATOREN: '6b0850bdff2b5f7ddaf45888',
  SPEISEKARTE: '6b0850c0d06696d9b50af18c',
  BESTELLUNGEN: '6b0850c19d19c5c4d6ab6cd9',
  BESTELLPOSITIONEN: '6b0850c21aee3c6ff960d428',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'speisekarte': {
    kategorie: [{ key: "vorspeise", get label() { return lookupLabel('speisekarte', 'kategorie', "vorspeise") ?? "Vorspeise"; } }, { key: "hauptgericht", get label() { return lookupLabel('speisekarte', 'kategorie', "hauptgericht") ?? "Hauptgericht"; } }, { key: "dessert", get label() { return lookupLabel('speisekarte', 'kategorie', "dessert") ?? "Dessert"; } }, { key: "getraenk", get label() { return lookupLabel('speisekarte', 'kategorie', "getraenk") ?? "Getränk"; } }, { key: "sonstiges", get label() { return lookupLabel('speisekarte', 'kategorie', "sonstiges") ?? "Sonstiges"; } }],
  },
  'bestellungen': {
    zahlungsstatus: [{ key: "offen", get label() { return lookupLabel('bestellungen', 'zahlungsstatus', "offen") ?? "Offen"; } }, { key: "bezahlt", get label() { return lookupLabel('bestellungen', 'zahlungsstatus', "bezahlt") ?? "Bezahlt"; } }],
  },
};

// Optimistic LookupValue writes: never re-type a label — resolve the schema
// option instead (its label is a locale-aware getter; falls back to the key).
// WRONG: status: { key: 'offen', label: 'Offen' }   (frozen in one language)
// RIGHT: status: lookupOption('<appKey>', 'status', 'offen')
export function lookupOption(app: string, field: string, key: string): LookupValue {
  return LOOKUP_OPTIONS[app]?.[field]?.find(o => o.key === key) ?? { key, label: key };
}

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'organisatoren': {
    'organisator_firstname': 'string/text',
    'organisator_lastname': 'string/text',
    'paypal_email': 'string/email',
    'zahlungshinweis': 'string/textarea',
  },
  'speisekarte': {
    'nummer': 'string/text',
    'bezeichnung': 'string/text',
    'kategorie': 'lookup/select',
    'preis': 'number',
    'beschreibung': 'string/textarea',
  },
  'bestellungen': {
    'besteller_firstname': 'string/text',
    'besteller_lastname': 'string/text',
    'bestelldatum': 'date/date',
    'organisator': 'applookup/select',
    'bemerkung': 'string/textarea',
    'zahlungsstatus': 'lookup/radio',
  },
  'bestellpositionen': {
    'bestellung': 'applookup/select',
    'speise': 'applookup/select',
    'anzahl': 'number',
    'sonderwunsch': 'string/text',
  },
};

export const HUB_TOPOLOGY: Record<string, { field: string; entity: string }[]> = {
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateOrganisatoren = StripLookup<Organisatoren['fields']>;
export type CreateSpeisekarte = StripLookup<Speisekarte['fields']>;
export type CreateBestellungen = StripLookup<Bestellungen['fields']>;
export type CreateBestellpositionen = StripLookup<Bestellpositionen['fields']>;