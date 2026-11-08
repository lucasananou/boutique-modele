import { getAllProducts, getProductBySlug } from "@/lib/products";
import { subscriptionPrice } from "@/lib/orders";
import { variantPrice } from "@/lib/productUtils";
import type { Product } from "@/lib/types";

/*
 * Catalogue de la vitrine : produits actifs lus en base (admin > Produits).
 * Les prix affichés sont donc ceux que le checkout facturera. `handle` est le
 * nom court utilisé par les gabarits de la maquette (ceremonie, vanille…).
 */

export const HANDLES: Record<string, string> = {
  ceremonie: "matcha-ceremonie",
  vanille: "latte-vanille",
  fraise: "latte-fraise",
  yuzu: "latte-yuzu",
  hojicha: "hojicha",
};
const SLUG_TO_HANDLE = Object.fromEntries(Object.entries(HANDLES).map(([h, s]) => [s, h]));

export interface CatalogVariant {
  id: string;
  label: string;
  price: number;
}

export interface CatalogItem {
  handle: string;
  productId: string;
  slug: string;
  name: string;
  /** Prix de base en centimes (première variante). */
  price: number;
  subPrice: number;
  variants: CatalogVariant[];
  /** Vignette du panier. */
  img: string;
  /** Fiche complète (pages produit uniquement). */
  product?: Product;
}

export interface Catalog {
  items: CatalogItem[];
  byHandle: Record<string, CatalogItem>;
}

export function showExamples(): boolean {
  return process.env.SHOW_EXAMPLE_CONTENT === "1";
}

function toItem(p: Product, withProduct = false): CatalogItem {
  const handle = SLUG_TO_HANDLE[p.slug] ?? p.slug;
  const variants = p.variants
    .filter((v) => v.available)
    .map((v) => ({ id: v.id, label: v.label, price: variantPrice(p, v.id) }));
  const price = variants[0]?.price ?? p.price;
  return {
    handle,
    productId: p.id,
    slug: p.slug,
    name: p.name,
    price,
    subPrice: subscriptionPrice(price),
    variants,
    img: `/stores/aoyuki/img/canette-${handle}.webp`,
    ...(withProduct ? { product: p } : {}),
  };
}

export async function loadCatalog(): Promise<Catalog> {
  const products = await getAllProducts("fr");
  const items = products.map((p) => toItem(p));
  return { items, byHandle: Object.fromEntries(items.map((i) => [i.handle, i])) };
}

export async function loadProduct(slug: string): Promise<CatalogItem | null> {
  const p = await getProductBySlug(slug, "fr");
  return p ? toItem(p, true) : null;
}

/** Données envoyées au navigateur (panier, ventes associées). */
export function clientCatalog(catalog: Catalog) {
  return {
    items: catalog.items.map(({ handle, productId, slug, name, price, subPrice, variants, img }) => ({
      handle,
      productId,
      slug,
      name,
      price,
      subPrice,
      variants,
      img,
    })),
    examples: showExamples(),
  };
}
