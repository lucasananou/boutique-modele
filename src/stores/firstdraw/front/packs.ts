/*
 * Types et formats des packs, sans dépendance serveur (importables par les
 * composants client). Chargement : catalog.ts.
 */

export const PRODUCT_SLUG = "colostrum-575";
export const SERVINGS_PER_UNIT = 30;
export const IMG = "/stores/firstdraw/img";

export interface Pack {
  variantId: string;
  key: string;
  /** « One jar », « Two jars »… */
  label: string;
  units: number;
  /** Prix achat simple (cents). */
  price: number;
  /** Prix abonnement (cents). */
  subPrice: number;
  /** Prix de référence : pots vendus à l'unité (cents), pour le prix barré. */
  was: number;
  img: string;
}

export interface Catalog {
  productId: string;
  slug: string;
  name: string;
  packs: Pack[];
}

/** « $49.00 » */
export const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;
/** « $49 » quand le montant est rond, sinon « $72.16 ». */
export const usdShort = (cents: number) =>
  cents % 100 === 0 ? `$${cents / 100}` : usd(cents);
/** Prix par portion, « $1.47 ». */
export const perServing = (cents: number, units: number) =>
  usd(Math.round(cents / (units * SERVINGS_PER_UNIT)));

/** Données d'un bouton d'ajout au sac (lues par Interactions.tsx). */
export function addAttrs(c: Catalog, p: Pack, intervalDays?: number) {
  return {
    "data-product": `${c.name}, ${p.label.toLowerCase()}${intervalDays ? ", subscription" : ""}`,
    "data-price": ((intervalDays ? p.subPrice : p.price) / 100).toFixed(2),
    "data-pid": c.productId,
    "data-slug": c.slug,
    "data-vid": p.variantId,
    "data-pack": p.label,
    "data-img": p.img,
    ...(intervalDays ? { "data-interval": String(intervalDays) } : {}),
  };
}
