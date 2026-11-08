import { getAllProducts, getProductBySlug } from "@/lib/products";
import { variantPrice } from "@/lib/productUtils";
import type { Product } from "@/lib/types";

/* Catalogue de la vitrine : produits actifs lus en base (admin > Produits). Les prix affichés sont ceux facturés. */

export interface CatalogItem {
  handle: string;
  productId: string;
  slug: string;
  name: string;
  /** Nom court affiché (sans « Bola »). */
  nom: string;
  famille: string;
  familleNom: string;
  description: string;
  price: number;
  variantId: string;
  variantLabel: string;
  img: string;
  images: { src: string; alt: string }[];
  available: boolean;
}

export interface Catalog {
  items: CatalogItem[];
  byHandle: Record<string, CatalogItem>;
}

const FAMILLES: Record<string, string> = { clairs: "Clairs", "rouges-et-roses": "Rouges et roses", verts: "Verts", bleus: "Bleus", argentes: "Argentés" };

export const commandesOuvertes = () => process.env.COMMANDES_OUVERTES === "1";
export const showExamples = () => process.env.SHOW_EXAMPLE_CONTENT === "1";

function toItem(p: Product): CatalogItem {
  const v = p.variants.find((x) => x.available) ?? p.variants[0];
  const price = v ? variantPrice(p, v.id) : p.price;
  const nom = p.name.replace(/^Bola\s+/, "");
  const images = p.images.map((i) => ({ src: i.src, alt: i.alt }));
  return {
    handle: p.slug,
    productId: p.id,
    slug: p.slug,
    name: p.name,
    nom,
    famille: p.category,
    familleNom: FAMILLES[p.category] ?? "",
    description: p.shortDescription,
    price,
    variantId: v?.id ?? "",
    variantLabel: v?.label ?? "",
    img: images[0]?.src ?? "",
    images,
    available: Boolean(p.inStock) && commandesOuvertes(),
  };
}

export async function loadCatalog(): Promise<Catalog> {
  const items = (await getAllProducts("fr")).map(toItem);
  return { items, byHandle: Object.fromEntries(items.map((i) => [i.handle, i])) };
}

export async function loadProduct(slug: string): Promise<CatalogItem | null> {
  const p = await getProductBySlug(slug, "fr");
  return p ? toItem(p) : null;
}
