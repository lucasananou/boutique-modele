import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { requestOrigin } from "@/lib/site";
import { hostProfile, intlIndexable } from "@/lib/domains";
import { defaultLocale, localizedPath, type Locale } from "@/lib/i18n";
import { categoryHref } from "@/lib/categories";
import { getArticles, getLandings } from "@/lib/pages";

/**
 * Un sitemap par domaine : chacun ne liste QUE ses propres URLs.
 * Le `.fr` ne doit contenir aucune URL du domaine international, et
 * réciproquement — sans quoi Google voit deux sites qui se réclament le même
 * contenu. Le sitemap dépend donc de l'hôte demandé, d'où le rendu dynamique.
 */
export const dynamic = "force-dynamic";

interface CanonicalEntry {
  path: string;
  lastModified: Date;
  freq: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}

/** Pages éditoriales & légales statiques (URLs canoniques). */
const staticPaths: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, freq: "weekly" },
  { path: "/boutique", priority: 0.9, freq: "daily" },
  { path: "/collections", priority: 0.7, freq: "weekly" },
  { path: "/la-maison", priority: 0.6, freq: "monthly" },
  { path: "/rendez-vous", priority: 0.6, freq: "monthly" },
  { path: "/guide-des-tailles", priority: 0.4, freq: "yearly" },
  { path: "/services/sur-mesure", priority: 0.5, freq: "monthly" },
  { path: "/livraison-retours", priority: 0.4, freq: "yearly" },
  { path: "/entretien", priority: 0.4, freq: "yearly" },
  { path: "/journal", priority: 0.5, freq: "weekly" },
  { path: "/mentions-legales", priority: 0.2, freq: "yearly" },
  { path: "/cgv", priority: 0.2, freq: "yearly" },
  { path: "/confidentialite", priority: 0.2, freq: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [origin, products, categories, collections, articles, landings] = await Promise.all([
    requestOrigin(),
    prisma.product.findMany({
      where: { status: "active" },
      select: { slug: true, updatedAt: true },
    }),
    prisma.category.findMany({ select: { slug: true, urlSlug: true } }),
    prisma.collection.findMany({ select: { slug: true } }),
    getArticles(),
    getLandings(),
  ]);

  const now = new Date();

  // Seules les URLs CANONIQUES (jamais d'URL filtrée avec query params).
  const entries: CanonicalEntry[] = [
    ...staticPaths.map((p) => ({
      path: p.path,
      lastModified: now,
      freq: p.freq,
      priority: p.priority,
    })),
    ...landings.map((landing) => ({
      path: `/${landing.slug}`,
      lastModified: now,
      freq: "monthly" as const,
      priority: 0.65,
    })),
    ...categories.map((c) => ({
      path: categoryHref(c),
      lastModified: now,
      freq: "weekly" as const,
      priority: 0.8,
    })),
    ...collections.map((c) => ({
      path: `/collection/${c.slug}`,
      lastModified: now,
      freq: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map((p) => ({
      path: `/produit/${p.slug}`,
      lastModified: p.updatedAt,
      freq: "weekly" as const,
      priority: 0.7,
    })),
    // Articles du journal (URLs racine exactes, préservées de l'ancien WordPress).
    ...articles.map((a) => ({
      path: `/${a.slug}`,
      lastModified: now,
      freq: "monthly" as const,
      priority: 0.6,
    })),
  ];

  // Un sitemap ne liste jamais d'URL en `noindex` : les traductions n'y entrent
  // qu'une fois l'indexation internationale ouverte.
  const profile = hostProfile(new URL(origin).host);
  const published: Locale[] = profile.locales.filter(
    (locale) => locale === defaultLocale || intlIndexable,
  );

  return entries.flatMap((entry) =>
    published.map((locale) => ({
      url: `${origin}${localizedPath(entry.path, locale)}`,
      lastModified: entry.lastModified,
      changeFrequency: entry.freq,
      priority: entry.priority,
    })),
  );
}
