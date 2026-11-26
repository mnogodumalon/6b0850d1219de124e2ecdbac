import { useMemo } from 'react';
import { IconPlus, IconPrinter, IconCash, IconToolsKitchen2, IconCircleCheck } from '@tabler/icons-react';
import type { DashboardData } from '@/hooks/useDashboardData';
import { useEntityCrud } from '@/components/EntityCrud';
import { flowActionFor, countOf } from '@/config/plan';
import { extractRecordId } from '@/services/livingAppsService';
import { LOOKUP_OPTIONS } from '@/types/app';
import type { EnrichedBestellpositionen } from '@/types/enriched';
import type { EnrichedBestellungen } from '@/types/enriched';
import { formatCurrency, lookupKey } from '@/lib/formatters';
import { useClock, gruss, namen, undoToast } from '@/lib/polish';
import { tx, appLabel } from '@/i18n';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { DashboardGrid } from '@/components/DashboardGrid';
import { StatStrip, StatStripItem } from '@/components/StatCard';
import { HeroBanner } from '@/components/HeroBanner';
import { KanbanWidget, type KanbanCard, type KanbanColumn } from '@/components/widgets/KanbanWidget';
import { ChartWidget, type ChartRow } from '@/components/widgets/ChartWidget';
import { EssenBestellenQr } from '@/components/widgets/JoinQr';

export default function DashboardOverview({ data }: { data: DashboardData }) {
  const { bestellungen, speisekarte, fetchAll } = data;
  const clock = useClock();

  // Payment is owned by the flow „Zahlung vermerken“ — this page only opens it.
  const markPaid = (id: string): string | undefined => {
    const go = flowActionFor('bestellungen', 'zahlungsstatus', id, 'bezahlt');
    if (!go) return tx('Der Ablauf „Zahlung vermerken“ ist nicht verfügbar.');
    go();
    undoToast(tx('Zahlung wird vermerkt …'));
    window.setTimeout(() => { void fetchAll(); }, 1200);
    return undefined;
  };

  const crud = useEntityCrud(data, {
    footer: (top) =>
      top.type === 'bestellungen' && lookupKey(top.record.fields.zahlungsstatus) !== 'bezahlt'
        ? { label: tx('Zahlung vermerken'), onClick: () => { markPaid(top.record.record_id); } }
        : undefined,
  });
  const enrichedBestellungen = crud.enriched.bestellungen as EnrichedBestellungen[];
  const enrichedPositionen = crud.enriched.bestellpositionen as EnrichedBestellpositionen[];

  const preisById = useMemo(() => new Map(speisekarte.map(s => [s.record_id, s.fields.preis ?? 0])), [speisekarte]);
  const kategorieById = useMemo(() => new Map(speisekarte.map(s => [s.record_id, lookupKey(s.fields.kategorie)])), [speisekarte]);

  // order → { portions, total }
  const sums = useMemo(() => {
    const m = new Map<string, { portionen: number; summe: number }>();
    for (const p of enrichedPositionen) {
      const bid = extractRecordId(p.fields.bestellung);
      if (!bid) continue;
      const sid = extractRecordId(p.fields.speise);
      const n = p.fields.anzahl ?? 0;
      const cur = m.get(bid) ?? { portionen: 0, summe: 0 };
      cur.portionen += n;
      cur.summe += n * (sid ? preisById.get(sid) ?? 0 : 0);
      m.set(bid, cur);
    }
    return m;
  }, [enrichedPositionen, preisById]);

  const isPaid = (b: EnrichedBestellungen) => lookupKey(b.fields.zahlungsstatus) === 'bezahlt';
  const offene = enrichedBestellungen.filter(b => !isPaid(b));
  const bezahlt = enrichedBestellungen.length - offene.length;
  const offenerBetrag = offene.reduce((s, b) => s + (sums.get(b.record_id)?.summe ?? 0), 0);
  const portionenGesamt = enrichedPositionen.reduce((s, p) => s + (p.fields.anzahl ?? 0), 0);

  const nameOf = (b: EnrichedBestellungen) =>
    [b.fields.besteller_firstname, b.fields.besteller_lastname].filter(Boolean).join(' ') || tx('Ohne Namen');

  const columns: KanbanColumn[] = (LOOKUP_OPTIONS['bestellungen']?.['zahlungsstatus'] ?? []).map(o => ({
    key: o.key,
    label: o.label,
    tone: o.key === 'bezahlt' ? 'success' : 'warning',
  }));

  const cards: KanbanCard[] = [...enrichedBestellungen]
    .sort((a, b) => (b.fields.bestelldatum ?? '').localeCompare(a.fields.bestelldatum ?? ''))
    .map(b => {
      const s = sums.get(b.record_id);
      return {
        id: b.record_id,
        column: isPaid(b) ? 'bezahlt' : 'offen',
        title: nameOf(b),
        subtitle: (
          <>
            {b.organisatorName || tx('Ohne Organisator')} · {formatCurrency(s?.summe ?? 0)}
            {s ? <> · {countOf('bestellpositionen', s.portionen, tx('Portionen'))}</> : null}
          </>
        ),
        tone: isPaid(b) ? 'success' : 'warning',
      };
    });

  const portionRows: ChartRow<EnrichedBestellpositionen>[] = enrichedPositionen.map(p => ({ id: `bestellposition:${p.record_id}`, data: p }));
  const vorspeisenRows = portionRows.filter(r => {
    const sid = extractRecordId(r.data.fields.speise);
    return sid ? kategorieById.get(sid) === 'vorspeise' : false;
  });
  const bestellRows: ChartRow<EnrichedBestellungen>[] = enrichedBestellungen.map(b => ({ id: `bestellung:${b.record_id}`, data: b }));

  const portionMeasure = {
    aggregate: 'sum' as const,
    label: tx('Portionen'),
    value: (r: ChartRow<EnrichedBestellpositionen>) => r.data.fields.anzahl ?? null,
    format: 'number' as const,
  };

  const openNames = namen(offene.map(b => b.fields.besteller_firstname || nameOf(b)));
  const contextLine =
    enrichedBestellungen.length === 0
      ? tx('Noch keine Bestellung — teile den QR-Code mit dem Team.')
      : offene.length > 0
        ? tx`${openNames} haben noch nicht bezahlt — ${formatCurrency(offenerBetrag)} offen.`
        : tx('Alle Bestellungen sind bezahlt.');

  const oldestOpen = offene[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{gruss(clock)}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{contextLine}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <a href="#/ansicht/sammelbestellung-druck" target="_blank" rel="noreferrer">
              <IconPrinter size={16} className="shrink-0" />
              {tx('Sammelbestellung drucken')}
            </a>
          </Button>
          {crud.bestellungen.canWrite && (
            <Button onClick={() => crud.bestellungen.openCreate({ zahlungsstatus: 'offen', bestelldatum: format(clock, 'yyyy-MM-dd') })}>
              <IconPlus size={16} className="shrink-0" />
              {tx('Bestellung erfassen')}
            </Button>
          )}
        </div>
      </div>

      <DashboardGrid
        variant="wide"
        hero={
          enrichedBestellungen.length === 0 ? (
            <HeroBanner
              icon={<IconToolsKitchen2 size={48} />}
              action={{ label: tx('Erste Bestellung erfassen'), onClick: () => crud.bestellungen.openCreate({ zahlungsstatus: 'offen', bestelldatum: format(clock, 'yyyy-MM-dd') }) }}
            >
              {tx('Noch nichts bestellt. Teile den QR-Code oder erfasse die erste Bestellung selbst.')}
            </HeroBanner>
          ) : undefined
        }
        kpis={
          enrichedBestellungen.length > 0 ? (
            <StatStrip>
              <StatStripItem
                title={tx('Zahlung offen')}
                value={offene.length === 0 ? tx('Alles bezahlt') : formatCurrency(offenerBetrag)}
                icon={<IconCash size={18} className="text-muted-foreground" />}
                tone={offene.length > 0 ? 'warning' : 'success'}
              />
              <StatStripItem
                title={tx('Bezahlt')}
                value={`${bezahlt} / ${enrichedBestellungen.length}`}
                icon={<IconCircleCheck size={18} className="text-muted-foreground" />}
              />
              <StatStripItem
                title={tx('Portionen gesamt')}
                value={portionenGesamt}
                icon={<IconToolsKitchen2 size={18} className="text-muted-foreground" />}
              />
            </StatStrip>
          ) : undefined
        }
        primary={
          <KanbanWidget
            cards={cards}
            columns={columns}
            onCardClick={card => {
              const rec = bestellungen.find(b => b.record_id === card.id);
              if (rec) crud.bestellungen.openDetail(rec);
            }}
            onCardMove={(id, col) => {
              if (col === 'bezahlt') return markPaid(id);
              return tx('Offen setzen: Bestellung öffnen und bearbeiten.');
            }}
            onAddCard={crud.bestellungen.canWrite
              ? col => crud.bestellungen.openCreate({ zahlungsstatus: col, bestelldatum: format(clock, 'yyyy-MM-dd') })
              : undefined}
          />
        }
        aside={
          <>
            <ChartWidget<EnrichedBestellpositionen>
              title={tx('Gesamtmenge je Speise')}
              rows={portionRows}
              dimension={{ kind: 'category', accessor: r => r.data.speiseName, label: tx('Speise') }}
              measure={portionMeasure}
            />
            <ChartWidget<EnrichedBestellpositionen>
              title={tx('Vorspeisen')}
              rows={vorspeisenRows}
              dimension={{ kind: 'category', accessor: r => r.data.speiseName, label: tx('Vorspeise') }}
              measure={portionMeasure}
            />
            <ChartWidget<EnrichedBestellungen>
              title={tx('Bestellungen je Organisator')}
              rows={bestellRows}
              dimension={{ kind: 'category', accessor: r => r.data.organisatorName, label: appLabel('organisatoren') }}
            />
            <div className="rounded-[27px] bg-card p-6 shadow-lg overflow-hidden flex flex-col items-center gap-3 text-center">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{tx('Bestellformular')}</h3>
              <EssenBestellenQr size={150} title={tx('QR-Code zum Bestellformular')} />
              {oldestOpen && (
                <p className="text-xs text-muted-foreground">
                  {tx`Älteste offene Zahlung: ${nameOf(oldestOpen)}`}
                </p>
              )}
            </div>
          </>
        }
      />
      {crud.surfaces}
    </div>
  );
}
