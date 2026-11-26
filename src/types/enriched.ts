import type { Bestellpositionen, Bestellungen } from './app';

export type EnrichedBestellungen = Bestellungen & {
  organisatorName: string;
};

export type EnrichedBestellpositionen = Bestellpositionen & {
  bestellungName: string;
  speiseName: string;
};
