/**
 * Field rules — GENERATED from the app metadata. Do not edit.
 *
 * The mechanical truth about every field: what kind it is, whether the
 * platform's base view marks it required, which lookup keys exist, where an
 * applookup points, what the label is. `useStepForm` validates against these
 * rules and phrases its messages with the real labels; `toWirePayload` uses
 * them to shape the create payload; `SHAPES` tells a page which input FORM
 * fits the data (a date pair wants a calendar, not two fields) — it is a
 * signal, not a gate.
 */
import { appLabel, fieldLabel, lookupLabel } from '@/i18n';
import { formatDate, formatDateTime } from '@/lib/formatters';
import { policyLabel } from './policy';
import { LOOKUP_OPTIONS } from '@/types/app';

export type EntityKey = 'organisatoren' | 'speisekarte' | 'bestellungen' | 'bestellpositionen';

/** The text fields of each entity — what a search may run over (generated;
 *  `never` for an entity without text of its own, e.g. a link table). */
export interface StringFields {
  "organisatoren": "organisator_firstname" | "organisator_lastname" | "paypal_email" | "zahlungshinweis";
  "speisekarte": "nummer" | "bezeichnung" | "beschreibung";
  "bestellungen": "besteller_firstname" | "besteller_lastname" | "bemerkung";
  "bestellpositionen": "sonderwunsch";
}
export type StringFieldKey<E extends EntityKey> = E extends keyof StringFields ? StringFields[E] : never;

/** The applookup fields of each entity (generated). A pick stored through
 *  `form.set` on one of these must carry its display name — at compile time
 *  (`StepForm.set`), because the review would otherwise show the id. */
export interface RecordFields {
  "organisatoren": never;
  "speisekarte": never;
  "bestellungen": "organisator";
  "bestellpositionen": "bestellung" | "speise";
}
export type RecordFieldKey<E extends EntityKey> = E extends keyof RecordFields ? RecordFields[E] : never;

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'email'
  | 'tel'
  | 'url'
  | 'number'
  | 'bool'
  | 'date'
  | 'datetime'
  | 'lookup'
  | 'multilookup'
  | 'record'
  | 'multirecord'
  | 'file'
  | 'geo';

export interface FieldRule {
  key: string;
  fulltype: string;
  kind: FieldKind;
  /** From the app's base view. A public page may override this per field. */
  required: boolean;
  /** Build-time label — `labelOf()` prefers the runtime i18n bundle. */
  label: string;
  /** Whether a journey may write it as a value. `file` is false: a file is UPLOADED
   *  (`form.file(key)` → FileField; the chosen file travels in the create as a data URL). */
  writable: boolean;
  maxLength?: number;
  /** lookup / multilookup: the ONLY valid write values. */
  options?: string[];
  /** record / multirecord: the target app (always) and its entity key (when inside this appgroup). */
  targetAppId?: string;
  targetEntity?: EntityKey;
  format?: 'currency';
  /** HTML autocomplete token derived from the field name (given-name, email, tel, …). */
  autoComplete?: string;
}

export interface EntityInfo {
  key: EntityKey;
  appId: string;
  label: string;
  /** PascalCase plural — `get<pascal>()` on the service. */
  pascal: string;
  /** The single-record suffix — `create<single>()` on the service. */
  single: string;
}

/** Input-form signals per entity: which data shape each field (pair) has.
 *  `range`  — two date fields that form a stay/period → AvailabilityRangePicker
 *  `choice` — a lookup with few options → ChoiceGroup pills instead of a select
 *  `record` — an applookup → EntitySelectStep with search, never a raw id field
 *  `stock`  — a quantity that has a stock/capacity counterpart → show it, warn on overshoot */
export type Shape =
  | { kind: 'range'; from: string; to: string }
  | { kind: 'choice'; field: string; count: number }
  | { kind: 'record'; field: string; targetEntity?: EntityKey }
  | { kind: 'stock'; field: string };

export const ENTITIES: Record<EntityKey, EntityInfo> = {
  "organisatoren": {
    "key": "organisatoren",
    "appId": "6b0850bdff2b5f7ddaf45888",
    "label": "Organisatoren",
    "pascal": "Organisatoren",
    "single": "OrganisatorenEntry"
  },
  "speisekarte": {
    "key": "speisekarte",
    "appId": "6b0850c0d06696d9b50af18c",
    "label": "Speisekarte",
    "pascal": "Speisekarte",
    "single": "SpeisekarteEntry"
  },
  "bestellungen": {
    "key": "bestellungen",
    "appId": "6b0850c19d19c5c4d6ab6cd9",
    "label": "Bestellungen",
    "pascal": "Bestellungen",
    "single": "BestellungenEntry"
  },
  "bestellpositionen": {
    "key": "bestellpositionen",
    "appId": "6b0850c21aee3c6ff960d428",
    "label": "Bestellpositionen",
    "pascal": "Bestellpositionen",
    "single": "BestellpositionenEntry"
  }
};

export const FIELD_RULES: Record<EntityKey, Record<string, FieldRule>> = {
  "organisatoren": {
    "organisator_firstname": {
      "key": "organisator_firstname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Vorname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "given-name"
    },
    "organisator_lastname": {
      "key": "organisator_lastname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Nachname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "family-name"
    },
    "paypal_email": {
      "key": "paypal_email",
      "fulltype": "string/email",
      "kind": "email",
      "required": true,
      "label": "PayPal-E-Mail-Adresse",
      "writable": true,
      "autoComplete": "email"
    },
    "zahlungshinweis": {
      "key": "zahlungshinweis",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Hinweis zur Zahlung",
      "writable": true
    }
  },
  "speisekarte": {
    "nummer": {
      "key": "nummer",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Nummer auf der Speisekarte",
      "writable": true,
      "maxLength": 4000
    },
    "bezeichnung": {
      "key": "bezeichnung",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Bezeichnung",
      "writable": true,
      "maxLength": 4000
    },
    "kategorie": {
      "key": "kategorie",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Kategorie",
      "writable": true,
      "options": [
        "vorspeise",
        "hauptgericht",
        "dessert",
        "getraenk",
        "sonstiges"
      ]
    },
    "preis": {
      "key": "preis",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Preis in Euro",
      "writable": true,
      "format": "currency"
    },
    "beschreibung": {
      "key": "beschreibung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Beschreibung",
      "writable": true
    }
  },
  "bestellungen": {
    "besteller_firstname": {
      "key": "besteller_firstname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Vorname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "given-name"
    },
    "besteller_lastname": {
      "key": "besteller_lastname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Nachname",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "family-name"
    },
    "bestelldatum": {
      "key": "bestelldatum",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Bestelldatum",
      "writable": true
    },
    "organisator": {
      "key": "organisator",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Organisator für die Zahlung",
      "writable": true,
      "targetAppId": "6b0850bdff2b5f7ddaf45888",
      "targetEntity": "organisatoren"
    },
    "bemerkung": {
      "key": "bemerkung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Bemerkung",
      "writable": true
    },
    "zahlungsstatus": {
      "key": "zahlungsstatus",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": false,
      "label": "Zahlungsstatus",
      "writable": true,
      "options": [
        "offen",
        "bezahlt"
      ]
    }
  },
  "bestellpositionen": {
    "bestellung": {
      "key": "bestellung",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Bestellung",
      "writable": true,
      "targetAppId": "6b0850c19d19c5c4d6ab6cd9",
      "targetEntity": "bestellungen"
    },
    "speise": {
      "key": "speise",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Speise",
      "writable": true,
      "targetAppId": "6b0850c0d06696d9b50af18c",
      "targetEntity": "speisekarte"
    },
    "anzahl": {
      "key": "anzahl",
      "fulltype": "number",
      "kind": "number",
      "required": true,
      "label": "Anzahl",
      "writable": true
    },
    "sonderwunsch": {
      "key": "sonderwunsch",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Sonderwunsch",
      "writable": true,
      "maxLength": 4000
    }
  }
};

export const SHAPES: Record<EntityKey, Shape[]> = {
  "organisatoren": [],
  "speisekarte": [
    {
      "kind": "choice",
      "field": "kategorie",
      "count": 5
    }
  ],
  "bestellungen": [
    {
      "kind": "choice",
      "field": "zahlungsstatus",
      "count": 2
    },
    {
      "kind": "record",
      "field": "organisator",
      "targetEntity": "organisatoren"
    }
  ],
  "bestellpositionen": [
    {
      "kind": "record",
      "field": "bestellung",
      "targetEntity": "bestellungen"
    },
    {
      "kind": "record",
      "field": "speise",
      "targetEntity": "speisekarte"
    }
  ]
};

/** The fields a record of this entity is recognised by (a person: first and
 *  last name; else its title-like text field) — the same choice the dashboard's
 *  enrichment makes for `<key>Name`. `useRecordSearch` resolves an applookup to
 *  this name (`ctx.ref('gast')` in `toItem`). */
export const DISPLAY_FIELDS: Record<EntityKey, string[]> = {
  "organisatoren": [
    "organisator_firstname"
  ],
  "speisekarte": [
    "bezeichnung"
  ],
  "bestellungen": [
    "besteller_firstname"
  ],
  "bestellpositionen": [
    "sonderwunsch"
  ]
};

/** The display name of a record: its display fields joined, else the first
 *  non-empty text value, else ''. */
/** A display-field value as text: strings as they are, a lookup `{ key, label }`
 *  (either door hydrates lookups to objects) by its label — an entity whose
 *  only title-like field is a lookup/select otherwise had no name at all. */
/** A date reads as a date (a target whose only readable fields are `beginn`/`ende` — Doodle KB 6),
 *  a number as a number; a record URL or a bare id is never a name (0.0.389). */
export function displayPart(v: unknown): string {
  if (typeof v === 'string') {
    const s = v.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return formatDate(s);
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return formatDateTime(s);
    if (/^https?:\/\//.test(s) || /^[0-9a-f]{24}$/i.test(s)) return '';
    return s;
  }
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : '';
  if (v && typeof v === 'object' && 'label' in v) {
    const l = (v as { label?: unknown }).label;
    return l === null || l === undefined ? '' : String(l).trim();
  }
  return '';
}

export function displayNameOf(entity: EntityKey, fields: Record<string, unknown>): string {
  const parts = (DISPLAY_FIELDS[entity] ?? [])
    .map(k => displayPart(fields[k]))
    .filter(v => v !== '');
  if (parts.length > 0) return parts.join(' ');
  for (const [k, rule] of Object.entries(FIELD_RULES[entity] ?? {})) {
    if (rule.kind !== 'text' && rule.kind !== 'email') continue;
    const v = fields[k];
    if (typeof v === 'string' && v.trim() !== '') return v.trim();
  }
  return '';
}

export function ruleOf(entity: EntityKey, key: string): FieldRule | undefined {
  return FIELD_RULES[entity]?.[key];
}

/** The field label as the user sees it — the owner's policy label first (a
 *  public page's "Felder anpassen"), runtime bundle second, generated label last. */
export function labelOf(entity: EntityKey, key: string): string {
  const own = policyLabel(entity, key);
  if (own) return own;
  const fromBundle = fieldLabel(entity, key);
  if (fromBundle !== key) return fromBundle;
  return ruleOf(entity, key)?.label ?? key;
}

export function entityLabel(entity: EntityKey): string {
  const fromBundle = appLabel(entity);
  if (fromBundle !== entity) return fromBundle;
  return ENTITIES[entity]?.label ?? entity;
}

/** Lookup options with runtime labels — the only legitimate source of `{key,label}` pairs. */
export function optionsOf(entity: EntityKey, key: string): Array<{ key: string; label: string }> {
  const generated = (LOOKUP_OPTIONS as Record<string, Record<string, Array<{ key: string; label: string }>>>)[entity]?.[key];
  if (generated && generated.length) return generated.map(o => ({ key: o.key, label: o.label }));
  const keys = ruleOf(entity, key)?.options ?? [];
  return keys.map(k => ({ key: k, label: lookupLabel(entity, key, k) ?? k }));
}

/** „Nicht ausgefüllt“ for a required field, by its kind: a checkbox that is
 *  `false` is NOT filled — the person did not consent (live 03.11.2026: a
 *  consent page validated with the box unticked and the grant took it). Every
 *  other kind is isEmptyValue. */
export function isUnfilled(entity: EntityKey, key: string, v: unknown): boolean {
  if (ruleOf(entity, key)?.kind === 'bool') return v !== true;
  return isEmptyValue(v);
}

export function isEmptyValue(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object' && 'from' in (v as object) && 'to' in (v as object)) {
    const r = v as { from: unknown; to: unknown };
    return isEmptyValue(r.from) && isEmptyValue(r.to);
  }
  return false;
}
