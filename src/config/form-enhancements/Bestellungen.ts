// Auto-generated. Per-entity form-enhancements config for "Bestellungen".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: [{"row": ["besteller_firstname", "besteller_lastname"]}, "organisator", {"row": ["bestelldatum", "zahlungsstatus"], "cols": "1fr 1fr"}, "bemerkung"],
  defaults: {
    'zahlungsstatus': { kind: 'lookup', key: 'offen', label: 'Offen' },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
