import { getProductBySlug } from "@/lib/products";
import { subscriptionPrice } from "@/lib/orders";
import { variantPrice } from "@/lib/productUtils";
import { IMG, PRODUCT_SLUG, type Catalog } from "./packs";

/*
 * Catalogue de la vitrine : le produit unique et ses packs, lus en base
 * (admin > Produits). Les prix affichés sont donc ceux que le checkout
 * facturera ; la remise abonnement vient de config.subscriptions.
 */

const PACK_IMAGES = [`${IMG}/fd-shop1.jpg`, `${IMG}/fd-shop2.jpg`, `${IMG}/fd-shop3.jpg`];

export async function loadCatalog(): Promise<Catalog | null> {
  const product = await getProductBySlug(PRODUCT_SLUG, "en");
  if (!product) return null;
  const unit = product.price;
  const packs = product.variants
    .filter((v) => v.available)
    .map((v, i) => {
      const units = Math.max(1, v.units ?? 1);
      const price = variantPrice(product, v.id);
      return {
        variantId: v.id,
        key: v.key ?? v.id,
        label: v.label,
        units,
        price,
        subPrice: subscriptionPrice(price),
        was: unit * units,
        img: PACK_IMAGES[Math.min(units, 3) - 1] ?? PACK_IMAGES[i] ?? PACK_IMAGES[0],
      };
    })
    .sort((a, b) => a.units - b.units);
  return { productId: product.id, slug: product.slug, name: product.name, packs };
}

