import { getProductsByCategory } from "@/lib/products";
import type { Product } from "@/lib/types";
import type { SeoLandingConfig } from "@/components/seo/SeoLandingPage";
import type { Locale } from "@/lib/i18n";

/** Sélectionne des produits pertinents pour une landing SEO, sans requête dédiée. */
export async function getSeoLandingProducts(
  landing: SeoLandingConfig,
  locale: Locale = "fr",
): Promise<Product[]> {
  const products = await getProductsByCategory(landing.productCategory, locale);
  const hints = landing.productHints.map((h) => h.toLowerCase());

  return products
    .filter((product) => product.inStock)
    .map((product) => {
      const haystack = [
        product.name,
        product.slug,
        product.materialLabel,
        product.shortDescription,
        product.collectionName,
      ]
        .join(" ")
        .toLowerCase();
      const score = hints.reduce(
        (total, hint) => total + (haystack.includes(hint) ? 1 : 0),
        0,
      );
      return { product, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ product }) => product)
    .slice(0, 8);
}
