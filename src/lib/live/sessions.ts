import { prisma } from "@/lib/db";
import { publicLiveEventWhere, publicLiveSessionWhere } from "@/lib/live/publicFilters";
import type { LiveStatus } from "@/generated/prisma";

const INACTIVE_AFTER_MS = 5 * 60 * 1000; // 5 minutes

function inactiveCutoff() {
  return new Date(Date.now() - INACTIVE_AFTER_MS);
}

export async function getActiveSessions() {
  return prisma.liveSession.findMany({
    where: publicLiveSessionWhere({
      status: { not: "INACTIVE" as LiveStatus },
      lastSeenAt: { gte: inactiveCutoff() },
    }),
    orderBy: { lastSeenAt: "desc" },
    take: 200,
  });
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getLiveStats() {
  const cutoff = inactiveCutoff();
  const dayStart = startOfToday();
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
  const activeWhere = publicLiveSessionWhere({
    status: { not: "INACTIVE" as LiveStatus },
    lastSeenAt: { gte: cutoff },
  });

  const [
    visitors,
    cartsAgg,
    checkouts,
    recentPurchases,
    sessionsToday,
    ordersTodayAgg,
    pageViewEvents,
  ] = await Promise.all([
    prisma.liveSession.count({ where: activeWhere }),
    prisma.liveSession.aggregate({
      where: { ...activeWhere, status: "CART" as LiveStatus },
      _count: true,
      _sum: { cartValue: true },
    }),
    prisma.liveSession.count({
      where: { ...activeWhere, status: "CHECKOUT" as LiveStatus },
    }),
    prisma.liveEvent.findMany({
      where: publicLiveEventWhere({
        eventType: "PURCHASE",
        createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
      }),
      select: { orderValue: true },
    }),
    // Sessions démarrées aujourd'hui
    prisma.liveSession.count({ where: publicLiveSessionWhere({ createdAt: { gte: dayStart } }) }),
    // Ventes réelles du jour (commandes payées)
    prisma.order.aggregate({
      where: {
        createdAt: { gte: dayStart },
        status: { in: ["PAID", "SHIPPED", "DELIVERED"] },
      },
      _count: true,
      _sum: { amountTotal: true },
    }),
    // Pages vues des 10 dernières minutes (pour le mini-graphe)
    prisma.liveEvent.findMany({
      where: publicLiveEventWhere({ eventType: "PAGE_VIEW", createdAt: { gte: tenMinAgo } }),
      select: { createdAt: true },
    }),
  ]);

  // Bucketing en 10 tranches d'1 minute (index 0 = il y a 10 min → 9 = maintenant)
  const pageViewsSeries = new Array(10).fill(0) as number[];
  const base = tenMinAgo.getTime();
  for (const ev of pageViewEvents) {
    const idx = Math.min(
      9,
      Math.floor((ev.createdAt.getTime() - base) / 60_000),
    );
    if (idx >= 0) pageViewsSeries[idx]++;
  }

  return {
    visitors,
    carts: cartsAgg._count,
    cartValue: cartsAgg._sum.cartValue ?? 0,
    checkouts,
    recentPurchaseCount: recentPurchases.length,
    recentPurchaseValue: recentPurchases.reduce(
      (s: number, e: { orderValue: number | null }) => s + (e.orderValue ?? 0),
      0,
    ),
    sessionsToday,
    salesTodayValue: ordersTodayAgg._sum.amountTotal ?? 0,
    ordersToday: ordersTodayAgg._count,
    pageViewsSeries,
  };
}

export async function getRecentEvents(limit = 30) {
  return prisma.liveEvent.findMany({
    where: publicLiveEventWhere({ eventType: { not: "HEARTBEAT" } }),
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      session: {
        select: { country: true, city: true, anonymousId: true },
      },
    },
  });
}

export async function markInactiveSessions() {
  return prisma.liveSession.updateMany({
    where: {
      status: { not: "INACTIVE" as LiveStatus },
      lastSeenAt: { lt: inactiveCutoff() },
    },
    data: { status: "INACTIVE" },
  });
}
