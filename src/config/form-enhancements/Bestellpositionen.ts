// Auto-generated. Per-entity form-enhancements config for "Bestellpositionen".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["bestellung", {"row": ["speise", "anzahl"], "cols": "2fr 1fr"}, "sonderwunsch"],
  defaults: {
    'anzahl': { kind: 'literal', value: 1 },
  },
  computed: {
    '_position_summe': { op: 'mul', left: { kind: 'field', key: 'anzahl' }, right: { kind: 'applookup', ownKey: 'speise', lookupKey: 'preis' } },
  },
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
