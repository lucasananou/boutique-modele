/*
 * Passerelle catalogue → contenus éditoriaux (journal).
 *
 * Les articles citent des pièces par CATÉGORIE (pas par slug figé) : on résout
 * de vrais produits en stock au rendu, côté serveur. Tout est encapsulé dans des
 * try/catch pour que le blog reste servi même si la base hoquette (dégradation
 * propre : le bloc produit disparaît, l'article reste lisible).
 */
import { cache } from "react";
import type { Category, Product } from "@/lib/types";
import { getProductBySlug, getProductsByCategory } from "@/lib/products";
import type { Locale } from "@/lib/i18n";

/** Forme minimale sérialisable d'un produit pour les blocs éditoriaux. */
export interface EditorialProduct {
  id: string;
  slug: string;
  name: string;
  /** Prix en centimes. */
  price: number;
  materialLabel: string;
  image: { src: string; alt: string };
  /** A des tailles à choisir → on renvoie vers la fiche plutôt que d'ajouter. */
  hasVariants: boolean;
  inStock: boolean;
}

function toEditorial(p: Product): EditorialProduct {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price,
    materialLabel: p.materialLabel,
    image: p.images[0] ?? { src: "", alt: p.name },
    hasVariants: p.variants.length > 0,
    inStock: p.inStock,
  };
}

/** Produits d'une catégorie, mémoïsés le temps d'un rendu (évite les requêtes en double). */
const categoryProducts = cache(
  async (cat: Category, locale: Locale = "fr"): Promise<Product[]> => {
    try {
      return await getProductsByCategory(cat, locale);
    } catch {
      return [];
    }
  },
);

/** Première pièce en stock d'une catégorie (option : préférer un nom/tissu contenant `match`). */
export const getEditorialByCategory = cache(
  async (cat: Category, match?: string, locale: Locale = "fr"): Promise<EditorialProduct | null> => {
    const list = await categoryProducts(cat, locale);
    if (!list.length) return null;
    let pool = list;
    if (match) {
      const m = match.toLowerCase();
      const filtered = list.filter(
        (p) =>
          p.name.toLowerCase().includes(m) ||
          p.materialLabel.toLowerCase().includes(m),
      );
      if (filtered.length) pool = filtered;
    }
    const pick = pool.find((p) => p.inStock) ?? pool[0];
    return pick ? toEditorial(pick) : null;
  },
);

/** Pièce précise par slug (repli si l'article curatie une pièce en particulier). */
export const getEditorialBySlug = cache(
  async (slug: string, locale: Locale = "fr"): Promise<EditorialProduct | null> => {
    try {
      const p = await getProductBySlug(slug, locale);
      return p ? toEditorial(p) : null;
    } catch {
      return null;
    }
  },
);

/** « La tenue de l'article » : une pièce par catégorie, dédupliquée. */
export async function resolveOutfit(
  cats: Category[],
  locale: Locale = "fr",
): Promise<EditorialProduct[]> {
  const out: EditorialProduct[] = [];
  const seen = new Set<string>();
  for (const cat of cats) {
    const p = await getEditorialByCategory(cat, undefined, locale);
    if (p && !seen.has(p.id)) {
      seen.add(p.id);
      out.push(p);
    }
  }
  return out;
}
