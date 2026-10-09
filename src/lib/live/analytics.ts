import { prisma } from "@/lib/db";
import { publicLiveEventWhere, publicLiveSessionWhere } from "@/lib/live/publicFilters";

const SINCE_24H = () => new Date(Date.now() - 24 * 60 * 60 * 1000);

export async function getLiveAnalytics() {
  const since = SINCE_24H();

  const [topPages, topProducts, topConversions, topCountries, topBrowsers, topReferrers] =
    await Promise.all([
      // Pages les plus vues (24h)
      prisma.liveEvent.groupBy({
        by: ["page"],
        where: publicLiveEventWhere({
          eventType: "PAGE_VIEW",
          page: { not: null },
          createdAt: { gte: since },
        }),
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 6,
      }),

      // Produits les plus consultés (24h)
      prisma.liveEvent.groupBy({
        by: ["productName"],
        where: publicLiveEventWhere({
          eventType: "PRODUCT_VIEW",
          productName: { not: null },
          createdAt: { gte: since },
        }),
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),

      // Conversions : produits achetés (depuis les commandes — toutes périodes)
      prisma.orderItem.groupBy({
        by: ["name"],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),

      // Pays (toutes les sessions)
      prisma.liveSession.groupBy({
        by: ["country"],
        where: publicLiveSessionWhere({ country: { not: null } }),
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 6,
      }),

      // Navigateurs
      prisma.liveSession.groupBy({
        by: ["browser"],
        where: publicLiveSessionWhere({ browser: { not: null } }),
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),

      // Sources (referrers)
      prisma.liveSession.groupBy({
        by: ["referrer"],
        where: publicLiveSessionWhere({ referrer: { not: null } }),
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),
    ]);

  return {
    topPages: topPages.map((r) => ({ label: r.page!, count: r._count.id })),
    topProducts: topProducts.map((r) => ({ label: r.productName!, count: r._count.id })),
    topConversions: topConversions.map((r) => ({ label: r.name, count: r._sum.quantity ?? 0 })),
    topCountries: topCountries.map((r) => ({ label: r.country!, count: r._count.id })),
    topBrowsers: topBrowsers.map((r) => ({ label: r.browser!, count: r._count.id })),
    topReferrers: topReferrers.map((r) => ({
      label: formatReferrer(r.referrer!),
      count: r._count.id,
    })),
  };
}

export type LiveAnalytics = Awaited<ReturnType<typeof getLiveAnalytics>>;

export function formatReferrer(ref: string): string {
  try {
    const url = new URL(ref);
    const host = url.hostname.replace("www.", "");
    if (host.includes("google")) return "Google";
    if (host.includes("facebook") || host.includes("fb.com")) return "Facebook";
    if (host.includes("instagram")) return "Instagram";
    if (host.includes("tiktok")) return "TikTok";
    if (host.includes("youtube")) return "YouTube";
    if (host.includes("twitter") || host.includes("t.co") || host.includes("x.com")) return "Twitter / X";
    if (host.includes("pinterest")) return "Pinterest";
    return host;
  } catch {
    return ref.slice(0, 40);
  }
}
