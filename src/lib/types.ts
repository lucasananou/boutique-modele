/* Modèle de données du catalogue (les données de référence vivent dans src/data
   et servent au seed ; le site lit la base via lib/products & lib/taxonomy). */

/** Tissus / matières (facette de filtrage) : slugs de la table Material. */
export type Material = string;

/** Catégorie de produits : slug de la table Category (propre à chaque boutique). */
export type Category = string;

export interface ProductVariant {
  /** Identifiant de variante (taille : "xs", "s", "m", "l", "xl"). */
  id: string;
  key?: string;
  label: string;
  /** SKU vendable propre à la variante, quand le fournisseur le donne. */
  sku?: string;
  /** Option affichée côté boutique : Taille, Couleur, Couleur / Taille. */
  optionName?: string;
  optionValue?: string;
  colorName?: string;
  colorHex?: string;
  sizeLabel?: string;
  stock?: number;
  /** Surcoût éventuel en centimes par rapport au prix de base. */
  priceDelta?: number;
  available: boolean;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  /** Référence marchande stable (SKU). */
  sku: string;
  /** Prix courant en centimes (TTC) — réellement facturé. */
  price: number;
  /** Prix barré (référence) en centimes, pour afficher une remise. */
  compareAtPrice?: number;
  category: Category;
  /** Nom affichable de la catégorie. */
  categoryName: string;
  /** Collection à laquelle la pièce appartient (slug). */
  collection: string;
  /** Nom affichable de la collection. */
  collectionName: string;
  materials: Material[];
  /** Libellé matière affiché (ex. « Viscose fluide · non transparent »). */
  materialLabel: string;
  shortDescription: string;
  description: string;
  /** Meta title dédié Google. Repli : nom produit. */
  seoTitle?: string;
  /** Meta description dédiée Google. Repli : description courte. */
  seoDescription?: string;
  /** Détails techniques affichés en fiche produit. */
  details: { label: string; value: string }[];
  images: { src: string; alt: string; variantId?: string }[];
  /** Variantes (tailles). Vide si pièce unique. */
  variants: ProductVariant[];
  badge?: string;
  /** Pièce phare mise en avant en homepage. */
  iconic?: boolean;
  /** Édition limitée. */
  limited?: boolean;
  /** Stock total réel (sert à l'affichage d'urgence « plus que X »). */
  stock: number;
  inStock: boolean;
}

export interface Collection {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  heroImage: { src: string; alt: string };
  /** Saison / signature (ex. « Printemps 2026 »). */
  season?: string;
}

export interface CategoryMeta {
  slug: Category;
  name: string;
  description: string;
  image: { src: string; alt: string };
  /** Chemin public (ex. « /robes »). */
  href: string;
  /** H1 / titre SEO (repli : nom). */
  seoTitle: string;
  /** Titre du bloc texte SEO (repli : H1). */
  seoHeading: string;
  /** Texte SEO sous la grille (absent : bloc masqué). */
  seoText?: string;
  faqs: { q: string; a: string }[];
}

export interface MaterialMeta {
  slug: Material;
  name: string;
  description: string;
}
