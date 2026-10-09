// Données de démonstration pour habiller /admin/live (mode ?demo=1).
// Généré côté client à chaque tick pour donner une impression "temps réel".
// Aucune écriture en base — purement cosmétique et réversible.

import type { LiveSession, LiveEventRow, LiveStats } from "@/store/live";
import type { LiveAnalytics } from "@/lib/live/analytics";
import { store } from "@/stores";

const DEMO_CITIES: { city: string; country: string; lat: number; lng: number }[] = [
  { city: "Paris", country: "France", lat: 48.85, lng: 2.35 },
  { city: "Lyon", country: "France", lat: 45.76, lng: 4.83 },
  { city: "Marseille", country: "France", lat: 43.3, lng: 5.37 },
  { city: "Strasbourg", country: "France", lat: 48.58, lng: 7.75 },
  { city: "Bruxelles", country: "Belgique", lat: 50.85, lng: 4.35 },
  { city: "Anvers", country: "Belgique", lat: 51.22, lng: 4.4 },
  { city: "Genève", country: "Suisse", lat: 46.2, lng: 6.14 },
  { city: "Londres", country: "Royaume-Uni", lat: 51.51, lng: -0.13 },
  { city: "Madrid", country: "Espagne", lat: 40.42, lng: -3.7 },
  { city: "Milan", country: "Italie", lat: 45.46, lng: 9.19 },
  { city: "Amsterdam", country: "Pays-Bas", lat: 52.37, lng: 4.9 },
  { city: "New York", country: "États-Unis", lat: 40.71, lng: -74.01 },
  { city: "Miami", country: "États-Unis", lat: 25.76, lng: -80.19 },
  { city: "Los Angeles", country: "États-Unis", lat: 34.05, lng: -118.24 },
  { city: "Montréal", country: "Canada", lat: 45.5, lng: -73.57 },
  { city: "Toronto", country: "Canada", lat: 43.65, lng: -79.38 },
  { city: "Casablanca", country: "Maroc", lat: 33.57, lng: -7.59 },
  { city: "São Paulo", country: "Brésil", lat: -23.55, lng: -46.63 },
  { city: "Buenos Aires", country: "Argentine", lat: -34.6, lng: -58.38 },
  { city: "Sydney", country: "Australie", lat: -33.87, lng: 151.21 },
];

const DEMO_PAGES = [
  "/",
  "/boutique",
  "/categorie-a",
  "/categorie-b",
  "/produit/produit-demo-a",
  "/produit/produit-demo-b",
  "/produit/produit-demo-c",
  "/collection/essentiels",
  "/panier",
  "/commande",
];

const DEMO_PRODUCTS = [
  { name: "Produit démo A", slug: "produit-demo-a" },
  { name: "Produit démo B", slug: "produit-demo-b" },
  { name: "Produit démo C", slug: "produit-demo-c" },
  { name: "Produit démo D", slug: "produit-demo-d" },
  { name: "Produit démo E", slug: "produit-demo-e" },
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function jitter(v: number, amt: number) {
  return v + (Math.random() - 0.5) * amt;
}

export function makeDemoSnapshot(): {
  sessions: LiveSession[];
  events: LiveEventRow[];
  stats: LiveStats;
} {
  const now = Date.now();
  const n = 24 + Math.floor(Math.random() * 16); // 24–39 visiteurs
  const sessions: LiveSession[] = [];

  for (let i = 0; i < n; i++) {
    // Ville stable par index → les points ne "téléportent" pas d'un tick à l'autre
    const c = DEMO_CITIES[i % DEMO_CITIES.length];
    const r = Math.random();
    const status =
      r > 0.93 ? "CONVERTED" : r > 0.82 ? "CHECKOUT" : r > 0.58 ? "CART" : "BROWSING";
    const cartItemsCount = status === "BROWSING" ? 0 : 1 + Math.floor(Math.random() * 3);
    const cartValue = cartItemsCount * (4900 + Math.floor(Math.random() * 8000));

    sessions.push({
      id: `demo-${i}`,
      anonymousId: `demo-${i}`,
      status,
      currentPage: pick(DEMO_PAGES),
      country: c.country,
      city: c.city,
      latitude: jitter(c.lat, 0.25),
      longitude: jitter(c.lng, 0.25),
      cartItemsCount,
      cartValue,
      orderValue: status === "CONVERTED" ? cartValue || 6900 : null,
      lastSeenAt: new Date(now - Math.floor(Math.random() * 120000)).toISOString(),
      createdAt: new Date(now - Math.floor(Math.random() * 3600000)).toISOString(),
    });
  }

  const cartSessions = sessions.filter((s) => s.status === "CART");
  const carts = cartSessions.length;
  const checkouts = sessions.filter((s) => s.status === "CHECKOUT").length;
  const cartValue = cartSessions.reduce((a, s) => a + s.cartValue, 0);
  const recentPurchaseCount =
    sessions.filter((s) => s.status === "CONVERTED").length + Math.floor(Math.random() * 3);
  const recentPurchaseValue = recentPurchaseCount * (6900 + Math.floor(Math.random() * 9000));

  const stats: LiveStats = {
    visitors: sessions.length,
    carts,
    cartValue,
    checkouts,
    recentPurchaseCount,
    recentPurchaseValue,
    sessionsToday: 320 + Math.floor(Math.random() * 60),
    salesTodayValue: 520000 + Math.floor(Math.random() * 90000),
    ordersToday: 28 + Math.floor(Math.random() * 10),
    pageViewsSeries: Array.from({ length: 10 }, () => 3 + Math.floor(Math.random() * 16)),
  };

  return { sessions, events: makeDemoEvents(sessions, now), stats };
}

function makeDemoEvents(sessions: LiveSession[], now: number): LiveEventRow[] {
  const weighted = [
    "PAGE_VIEW", "PAGE_VIEW", "PAGE_VIEW", "PRODUCT_VIEW", "PRODUCT_VIEW",
    "ADD_TO_CART", "ADD_TO_CART", "CART_UPDATE", "BEGIN_CHECKOUT", "PURCHASE", "REMOVE_FROM_CART",
  ] as const;
  const evs: LiveEventRow[] = [];

  for (let i = 0; i < 32; i++) {
    const s = pick(sessions);
    const t = pick(weighted);
    const prod = pick(DEMO_PRODUCTS);
    const withProduct = t === "PRODUCT_VIEW" || t === "ADD_TO_CART";
    evs.push({
      id: `demo-ev-${i}`,
      sessionId: s.id,
      eventType: t,
      page: t === "PAGE_VIEW" ? pick(DEMO_PAGES) : null,
      productName: withProduct ? prod.name : null,
      productSlug: withProduct ? prod.slug : null,
      cartValue: null,
      orderValue: t === "PURCHASE" ? 6900 + Math.floor(Math.random() * 12000) : null,
      orderRef: t === "PURCHASE" ? `${store.orders.prefix}-2026-${1000 + Math.floor(Math.random() * 9000)}` : null,
      createdAt: new Date(now - i * 14000 - Math.floor(Math.random() * 9000)).toISOString(),
      session: { country: s.country, city: s.city, anonymousId: s.anonymousId },
    });
  }
  return evs;
}

export function makeDemoAnalytics(): LiveAnalytics {
  const mk = (entries: [string, number][]) =>
    entries.map(([label, count]) => ({ label, count }));
  return {
    topPages: mk([
      ["/", 342], ["/boutique", 228], ["/categorie-a", 176],
      ["/produit/produit-demo-a", 121], ["/categorie-b", 98], ["/collection/essentiels", 74],
    ]),
    topProducts: mk([
      ["Produit démo A", 64], ["Produit démo B", 52],
      ["Produit démo C", 41], ["Produit démo D", 33],
      ["Produit démo E", 27],
    ]),
    topConversions: mk([
      ["Produit démo A", 23], ["Produit démo C", 18],
      ["Produit démo B", 15], ["Produit démo D", 11],
      ["Produit démo E", 8],
    ]),
    topCountries: mk([
      ["France", 412], ["Belgique", 97], ["Suisse", 63],
      ["Canada", 54], ["États-Unis", 41], ["Royaume-Uni", 29],
    ]),
    topBrowsers: mk([
      ["Chrome", 523], ["Safari", 287], ["Edge", 96], ["Firefox", 44],
    ]),
    topReferrers: mk([
      ["Google", 298], ["Instagram", 213], ["Direct", 156], ["Facebook", 89], ["TikTok", 52],
    ]),
  };
}

/** Données factices agrégées sur une période (mode démo + sélecteur de période). */
export function makeDemoRange(fromISO?: string, toISO?: string) {
  const from = fromISO ? new Date(fromISO).getTime() : Date.now() - 86_400_000;
  const to = toISO ? new Date(toISO).getTime() : Date.now();
  const days = Math.max(1, Math.round((to - from) / 86_400_000));

  const nSessions = Math.min(240, 30 + days * 12);
  const sessions: LiveSession[] = [];
  for (let i = 0; i < nSessions; i++) {
    const c = DEMO_CITIES[i % DEMO_CITIES.length];
    const r = Math.random();
    const status =
      r > 0.9 ? "CONVERTED" : r > 0.8 ? "CHECKOUT" : r > 0.55 ? "CART" : "BROWSING";
    const cartItemsCount = status === "BROWSING" ? 0 : 1 + Math.floor(Math.random() * 3);
    const cartValue = cartItemsCount * (4900 + Math.floor(Math.random() * 8000));
    const ts = new Date(from + Math.random() * (to - from)).toISOString();
    sessions.push({
      id: `demo-r-${i}`,
      anonymousId: `demo-r-${i}`,
      status,
      currentPage: pick(DEMO_PAGES),
      country: c.country,
      city: c.city,
      latitude: jitter(c.lat, 0.25),
      longitude: jitter(c.lng, 0.25),
      cartItemsCount,
      cartValue,
      orderValue: status === "CONVERTED" ? cartValue || 6900 : null,
      lastSeenAt: ts,
      createdAt: ts,
    });
  }

  const purchases = Math.round(days * (8 + Math.random() * 6));
  const stats: LiveStats = {
    visitors: Math.round(days * (320 + Math.random() * 80)),
    carts: Math.round(days * (44 + Math.random() * 20)),
    cartValue: 0,
    checkouts: Math.round(days * (19 + Math.random() * 8)),
    recentPurchaseCount: purchases,
    recentPurchaseValue: purchases * (7000 + Math.floor(Math.random() * 9000)),
    sessionsToday: Math.round(days * (320 + Math.random() * 80)),
    salesTodayValue: Math.round(days * (520000 + Math.random() * 90000)),
    ordersToday: purchases,
    pageViewsSeries: Array.from({ length: 12 }, () => Math.round(days * (18 + Math.random() * 30))),
  };

  const base = makeDemoAnalytics();
  const scaleRows = (rows: { label: string; count: number }[]) =>
    rows.map((r) => ({ label: r.label, count: Math.round(r.count * days) }));

  return {
    stats,
    sessions,
    events: makeDemoEvents(sessions, to),
    analytics: {
      topPages: scaleRows(base.topPages),
      topProducts: scaleRows(base.topProducts),
      topConversions: scaleRows(base.topConversions),
      topCountries: scaleRows(base.topCountries),
      topBrowsers: scaleRows(base.topBrowsers),
      topReferrers: scaleRows(base.topReferrers),
    },
  };
}
