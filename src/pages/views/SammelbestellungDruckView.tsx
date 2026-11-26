/**
 * src/pages/views/SammelbestellungDruckView.tsx — „Sammelbestellung drucken“ (dashboard.views).
 *
 * ROUTE   #/ansicht/sammelbestellung-druck — outside the dashboard chrome (print surface).
 * LIVE    static — loads once.
 * READS   bestellpositionen (bestellung, speise, anzahl, sonderwunsch); speisekarte (nummer, bezeichnung, kategorie, preis)
 * PURPOSE Druckblatt für das Restaurant: alle bestellten Speisen mit Gesamtanzahl je Speise, die Vorspeisen gesondert.
 */
import { useMemo } from 'react';
import { useLiveRecords } from '@/hooks/useLiveRecords';
import { extractRecordId } from '@/services/livingAppsService';
import { lookupKey } from '@/lib/formatters';
import { tx } from '@/i18n';

interface Row {
  id: string;
  nummer: string;
  name: string;
  kategorie: string;
  kategorieLabel: string;
  anzahl: number;
  wuensche: string[];
}

export default function SammelbestellungDruckView() {
  const bestellpositionen = useLiveRecords('bestellpositionen', { intervalMs: 0 });
  const speisekarte = useLiveRecords('speisekarte', { intervalMs: 0 });

  const rows = useMemo<Row[]>(() => {
    const speisen = new Map(speisekarte.records.map(s => [s.record_id, s]));
    const acc = new Map<string, Row>();
    for (const p of bestellpositionen.records) {
      const sid = extractRecordId(p.fields.speise);
      if (!sid) continue;
      const s = speisen.get(sid);
      const row = acc.get(sid) ?? {
        id: sid,
        nummer: s?.fields.nummer ?? '',
        name: s?.fields.bezeichnung ?? '—',
        kategorie: lookupKey(s?.fields.kategorie) ?? '',
        kategorieLabel: s?.fields.kategorie?.label ?? '',
        anzahl: 0,
        wuensche: [],
      };
      const n = p.fields.anzahl ?? 0;
      row.anzahl += n;
      const w = p.fields.sonderwunsch?.trim();
      if (w) row.wuensche.push(n > 1 ? `${n}× ${w}` : w);
      acc.set(sid, row);
    }
    return [...acc.values()].sort(
      (a, b) => a.kategorie.localeCompare(b.kategorie) || a.nummer.localeCompare(b.nummer, undefined, { numeric: true }),
    );
  }, [bestellpositionen.records, speisekarte.records]);

  const vorspeisen = rows.filter(r => r.kategorie === 'vorspeise');
  const total = rows.reduce((s, r) => s + r.anzahl, 0);
  const failed = (bestellpositionen.error && bestellpositionen.records.length === 0)
    ? bestellpositionen
    : (speisekarte.error && speisekarte.records.length === 0) ? speisekarte : null;

  const line = (r: Row) => (
    <li key={r.id} className="border-b border-border py-2 break-inside-avoid">
      <div className="flex items-baseline gap-4">
        <span className="w-16 shrink-0 text-muted-foreground">{r.nummer}</span>
        <span className="min-w-0 flex-1 font-medium">{r.name}</span>
        <span className="shrink-0 font-bold tabular-nums">{r.anzahl}×</span>
      </div>
      {r.wuensche.length > 0 && (
        <p className="ml-20 text-sm text-muted-foreground">{tx('Sonderwünsche')}: {r.wuensche.join('; ')}</p>
      )}
    </li>
  );

  return (
    <main className="min-h-dvh bg-background p-8 text-foreground text-lg print:p-0">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-semibold">{tx('Sammelbestellung Hua-Hin')}</h1>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground print:hidden"
          >
            {tx('Drucken / als PDF speichern')}
          </button>
        </div>

        {failed && (
          <p role="alert" data-live-error className="mt-6 text-destructive">
            {failed.unauthorized ? tx('Bitte melde dich an, um diese Ansicht zu sehen.') : tx('Die Daten konnten nicht geladen werden.')}
          </p>
        )}

        {!failed && rows.length === 0 && (
          <p className="mt-6 text-muted-foreground">{tx('Noch keine Bestellung')}</p>
        )}

        {rows.length > 0 && (
          <>
            <section className="mt-8">
              <h2 className="text-xl font-semibold">{tx('Vorspeisen')}</h2>
              {vorspeisen.length === 0
                ? <p className="mt-2 text-muted-foreground">{tx('Keine Vorspeisen')}</p>
                : <ul className="mt-2">{vorspeisen.map(line)}</ul>}
            </section>
            <section className="mt-8">
              <h2 className="text-xl font-semibold">{tx('Alle Speisen')}</h2>
              <ul className="mt-2">{rows.map(line)}</ul>
              <p className="mt-4 text-right font-semibold">{tx`Gesamt: ${total} Portionen`}</p>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
