import { prisma } from "@/lib/db";
import type { Catalog, CatalogItem } from "./catalog";

/*
 * Collections de la vitrine, lues en base (admin > Collections) : une collection
 * sans produit actif n'apparaît nulle part. Les finitions de couleur renvoient
 * vers les catégories /bola-de-grossesse/* déjà indexées, pour ne pas créer de doublon.
 */

export interface Tuile {
  href: string;
  nom: string;
  img: string;
  alt: string;
  nombre: number;
}

export interface CollectionVue extends Tuile {
  slug: string;
  titre: string;
  description: string;
  items: CatalogItem[];
}

const P = "/stores/monjolibola/produits";

export async function loadCollections(catalog: Catalog): Promise<CollectionVue[]> {
  const rows = await prisma.collection.findMany({ orderBy: { sortOrder: "asc" } });
  return rows
    .map((c) => {
      const items = catalog.items.filter((i) => i.collection === c.slug);
      return {
        slug: c.slug,
        href: `/collections/${c.slug}`,
        nom: c.name,
        titre: c.tagline,
        description: c.description,
        img: c.heroImageSrc || items[0]?.img || "",
        alt: c.heroImageAlt || c.name,
        nombre: items.length,
        items,
      };
    })
    .filter((c) => c.items.length > 0);
}

/** Tuiles de finition : mêmes filtres que les catégories /bola-de-grossesse/dore et /argente. */
export function tuilesCouleur(catalog: Catalog): Tuile[] {
  const compte = (re: RegExp) => catalog.items.filter((i) => re.test(i.matiere)).length;
  const tuiles: Tuile[] = [
    { href: "/bola-de-grossesse/dore", nom: "Couleur dorée", img: `${P}/bola-de-grossesse-rond-dore.webp`, alt: "Bola Rond doré", nombre: compte(/couleur dorée/i) },
    { href: "/bola-de-grossesse/argente", nom: "Couleur argentée", img: `${P}/bola-de-grossesse-fleur-argentee.webp`, alt: "Bola Fleur argentée", nombre: compte(/couleur argent/i) },
  ];
  return tuiles.filter((t) => t.nombre > 0);
}
