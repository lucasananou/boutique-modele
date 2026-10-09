import { prisma } from "@/lib/db";
import { convertToEur, type Currency } from "@/lib/currency";

/**
 * Chiffres de la barre admin : trois métriques, leur variation face à la
 * période précédente, et une micro-série pour le sparkline.
 *
 * Volontairement séparé de `getRangeSnapshot`, qui lance une douzaine de
 * requêtes pour alimenter le dashboard complet : cette barre s'affiche sur
 * CHAQUE page vue par un admin, elle doit rester peu coûteuse.
 */

export type TopbarPeriod = "today" | "7d" | "30d";

export interface TopbarMetric {
  value: number;
  previous: number;
  /** Répartition sur la période, pour le tracé. */
  series: number[];
}

export interface TopbarSnapshot {
  period: TopbarPeriod;
  sessions: TopbarMetric;
  /** En centimes d'EURO : les commandes étrangères sont reconverties. */
  revenue: TopbarMetric;
  orders: TopbarMetric;
}

const PAID = ["PAID", "SHIPPED", "DELIVERED"] as const;
const BUCKETS = 12;

/** Fenêtre courante et fenêtre précédente de même durée. */
function windows(period: TopbarPeriod): { from: Date; to: Date; prevFrom: Date } {
  const to = new Date();
  const from = new Date(to);

  if (period === "today") {
    from.setHours(0, 0, 0, 0);
  } else {
    from.setDate(from.getDate() - (period === "7d" ? 7 : 30));
  }

  const span = to.getTime() - from.getTime();
  return { from, to, prevFrom: new Date(from.getTime() - span) };
}

function bucket(times: Date[], from: Date, to: Date): number[] {
  const series = new Array(BUCKETS).fill(0) as number[];
  const span = Math.max(1, to.getTime() - from.getTime());
  for (const t of times) {
    const i = Math.floor(((t.getTime() - from.getTime()) / span) * BUCKETS);
    if (i >= 0 && i < BUCKETS) series[i]++;
  }
  return series;
}

function bucketWeighted(
  rows: { at: Date; weight: number }[],
  from: Date,
  to: Date,
): number[] {
  const series = new Array(BUCKETS).fill(0) as number[];
  const span = Math.max(1, to.getTime() - from.getTime());
  for (const r of rows) {
    const i = Math.floor(((r.at.getTime() - from.getTime()) / span) * BUCKETS);
    if (i >= 0 && i < BUCKETS) series[i] += r.weight;
  }
  return series;
}

export async function getTopbarSnapshot(
  period: TopbarPeriod = "today",
): Promise<TopbarSnapshot> {
  const { from, to, prevFrom } = windows(period);

  // Une seule lecture par table, couvrant les deux fenêtres : on découpe
  // ensuite en mémoire plutôt que de doubler les allers-retours en base.
  const [sessions, orders] = await Promise.all([
    prisma.liveSession.findMany({
      where: { lastSeenAt: { gte: prevFrom, lte: to } },
      select: { lastSeenAt: true },
    }),
    prisma.order.findMany({
      where: { status: { in: [...PAID] }, createdAt: { gte: prevFrom, lte: to } },
      select: { createdAt: true, amountTotal: true, currency: true },
    }),
  ]);

  const current = <T extends { at: Date }>(rows: T[]) => rows.filter((r) => r.at >= from);
  const previous = <T extends { at: Date }>(rows: T[]) => rows.filter((r) => r.at < from);

  const sessionRows = sessions.map((s) => ({ at: s.lastSeenAt }));

  // Le CA additionne des devises différentes depuis l'ouverture des marchés
  // étranger : chaque commande est ramenée en euro, au taux figé qui a servi à
  // fabriquer son prix. Sans ça, un shekel compterait comme un euro.
  const orderRows = orders.map((o) => ({
    at: o.createdAt,
    eur: convertToEur(o.amountTotal, o.currency.toUpperCase() as Currency),
  }));

  const sum = (rows: { eur: number }[]) => rows.reduce((t, r) => t + r.eur, 0);

  return {
    period,
    sessions: {
      value: current(sessionRows).length,
      previous: previous(sessionRows).length,
      series: bucket(current(sessionRows).map((r) => r.at), from, to),
    },
    revenue: {
      value: sum(current(orderRows)),
      previous: sum(previous(orderRows)),
      series: bucketWeighted(
        current(orderRows).map((r) => ({ at: r.at, weight: r.eur })),
        from,
        to,
      ),
    },
    orders: {
      value: current(orderRows).length,
      previous: previous(orderRows).length,
      series: bucket(current(orderRows).map((r) => r.at), from, to),
    },
  };
}
