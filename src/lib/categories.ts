import { cache } from "react";
import { prisma } from "@/lib/db";

/*
 * URLs publiques des catégories — lues en base (Category.urlSlug, éditable dans
 * l'admin, propre à chaque boutique). Le slug INTERNE (produits, filtres) ne
 * change pas ; seule l'URL publique en dépend. Sans urlSlug : /<slug>.
 */

const loadRoutes = cache(async () =>
  prisma.category.findMany({ select: { slug: true, urlSlug: true } }),
);

/** Chemin public d'une catégorie (objet déjà chargé). */
export function categoryHref(c: { slug: string; urlSlug?: string | null }): string {
  return `/${c.urlSlug || c.slug}`;
}

/** Chemin public d'une catégorie depuis son slug interne. */
export async function categoryPath(slug: string): Promise<string> {
  const c = (await loadRoutes()).find((r) => r.slug === slug);
  return categoryHref(c ?? { slug });
}

/** Segment d'URL à la racine → slug interne de catégorie (ou null). */
export async function categoryFromSegment(segment: string): Promise<string | null> {
  const routes = await loadRoutes();
  const found = routes.find((r) => (r.urlSlug || r.slug) === segment);
  return found?.slug ?? null;
}
