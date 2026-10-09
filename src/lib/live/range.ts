import { prisma } from "@/lib/db";
import { formatReferrer, type LiveAnalytics } from "@/lib/live/analytics";
import { publicLiveEventWhere, publicLiveSessionWhere } from "@/lib/live/publicFilters";
import type { LiveStats } from "@/store/live";

/** Répartit des timestamps en N tranches égales sur [from, to]. */
function bucketSeries(times: Date[], from: number, to: number, buckets = 12): number[] {
  const series = new Array(buckets).fill(0) as number[];
  const span = Math.max(1, to - from);
  for (const t of times) {
    const idx = Math.min(buckets - 1, Math.floor(((t.getTime() - from) / span) * buckets));
    if (idx >= 0) series[idx]++;
  }
  return series;
}

export interface RangeSnapshot {
  stats: LiveStats;
  sessions: unknown[];
  events: unknown[];
  analytics: LiveAnalytics;
}

/** Agrège toutes les données du dashboard sur un intervalle [from, to]. */
export async function getRangeSnapshot(from: Date, to: Date): Promise<RangeSnapshot> {
  const inRange = { createdAt: { gte: from, lte: to } };
  const paidStatuses = ["PAID", "SHIPPED", "DELIVERED"] as const;

  const [
    sessions,
    newSessionsCount,
    activeSessions,
    cartSessions,
    checkoutSessions,
    purchaseEvents,
    ordersAgg,
    ordersInRange,
    pageViewRows,
    events,
    topPages,
    topProducts,
    topCountries,
    topBrowsers,
    topReferrers,
  ] = await Promise.all([
    prisma.liveSession.findMany({
      where: publicLiveSessionWhere(inRange),
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
    prisma.liveSession.count({ where: publicLiveSessionWhere(inRange) }),
    // Visiteuses ACTIVES sur la période, et non « sessions créées » : une
    // LiveSession est créée une seule fois par identifiant anonyme, donc une
    // visiteuse déjà venue n'en crée plus jamais. Compter les créations
    // affichait « 0 visiteur » alors que la période comptait des centaines de
    // pages vues (constaté du 10 au 13 août).
    prisma.liveEvent.groupBy({
      by: ["sessionId"],
      where: publicLiveEventWhere(inRange),
    }),
    prisma.liveEvent.groupBy({
      by: ["sessionId"],
      where: publicLiveEventWhere({ eventType: "ADD_TO_CART", ...inRange }),
    }),
    prisma.liveEvent.groupBy({
      by: ["sessionId"],
      where: publicLiveEventWhere({ eventType: "BEGIN_CHECKOUT", ...inRange }),
    }),
    prisma.liveEvent.findMany({
      where: publicLiveEventWhere({ eventType: "PURCHASE", ...inRange }),
      select: { orderValue: true },
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: from, lte: to }, status: { in: [...paidStatuses] } },
      _count: true,
      _sum: { amountTotal: true },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: from, lte: to }, status: { in: [...paidStatuses] } },
      select: { id: true },
    }),
    prisma.liveEvent.findMany({
      where: publicLiveEventWhere({ eventType: "PAGE_VIEW", ...inRange }),
      select: { createdAt: true },
    }),
    prisma.liveEvent.findMany({
      where: publicLiveEventWhere({ eventType: { not: "HEARTBEAT" }, ...inRange }),
      orderBy: { createdAt: "desc" },
      take: 40,
      include: { session: { select: { country: true, city: true, anonymousId: true } } },
    }),
    prisma.liveEvent.groupBy({
      by: ["page"],
      where: publicLiveEventWhere({ eventType: "PAGE_VIEW", page: { not: null }, ...inRange }),
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 6,
    }),
    prisma.liveEvent.groupBy({
      by: ["productName"],
      where: publicLiveEventWhere({ eventType: "PRODUCT_VIEW", productName: { not: null }, ...inRange }),
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
    prisma.liveSession.groupBy({
      by: ["country"],
      where: publicLiveSessionWhere({ country: { not: null }, ...inRange }),
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 6,
    }),
    prisma.liveSession.groupBy({
      by: ["browser"],
      where: publicLiveSessionWhere({ browser: { not: null }, ...inRange }),
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
    prisma.liveSession.groupBy({
      by: ["referrer"],
      where: publicLiveSessionWhere({ referrer: { not: null }, ...inRange }),
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
  ]);

  const orderIds = ordersInRange.map((o: { id: string }) => o.id);
  const topConversions = orderIds.length
    ? await prisma.orderItem.groupBy({
        by: ["name"],
        where: { orderId: { in: orderIds } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      })
    : [];

  const purchaseValue = purchaseEvents.reduce(
    (s: number, e: { orderValue: number | null }) => s + (e.orderValue ?? 0),
    0,
  );

  // Une visiteuse compte si elle a été ACTIVE sur la période. On garde le
  // nombre de nouvelles venues comme repli, si aucun événement n'est enregistré.
  const visitorCount = Math.max(activeSessions.length, newSessionsCount);

  const stats: LiveStats = {
    visitors: visitorCount,
    carts: cartSessions.length,
    cartValue: 0,
    checkouts: checkoutSessions.length,
    recentPurchaseCount: purchaseEvents.length,
    recentPurchaseValue: purchaseValue,
    sessionsToday: visitorCount,
    salesTodayValue: ordersAgg._sum.amountTotal ?? 0,
    ordersToday: ordersAgg._count,
    pageViewsSeries: bucketSeries(pageViewRows.map((r) => r.createdAt), from.getTime(), to.getTime()),
  };

  return {
    stats,
    sessions,
    events,
    analytics: {
      topPages: topPages.map((r) => ({ label: r.page!, count: r._count.id })),
      topProducts: topProducts.map((r) => ({ label: r.productName!, count: r._count.id })),
      topConversions: topConversions.map((r) => ({ label: r.name, count: r._sum.quantity ?? 0 })),
      topCountries: topCountries.map((r) => ({ label: r.country!, count: r._count.id })),
      topBrowsers: topBrowsers.map((r) => ({ label: r.browser!, count: r._count.id })),
      topReferrers: topReferrers.map((r) => ({ label: formatReferrer(r.referrer!), count: r._count.id })),
    },
  };
}
