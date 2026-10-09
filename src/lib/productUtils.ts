import type { Product } from "./types";

/**
 * Calcule le prix d'une variante (prix de base + delta éventuel).
 * Fonction PURE : opère sur un Product déjà chargé — utilisable côté client.
 */
export function variantPrice(product: Product, variantId?: string): number {
  if (!variantId) return product.price;
  const v = product.variants.find((x) => x.id === variantId);
  return product.price + (v?.priceDelta ?? 0);
}

/**
 * Pourcentage de remise arrondi entre le prix barré et le prix courant.
 * Renvoie 0 si pas de prix barré valide ou si la remise est nulle/négative.
 */
export function discountPercent(
  price: number,
  compareAtPrice?: number,
): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round((1 - price / compareAtPrice) * 100);
}
