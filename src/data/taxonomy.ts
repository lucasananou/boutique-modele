import type { CategoryMeta, Collection, MaterialMeta } from "@/lib/types";

/*
 * Données de DÉMONSTRATION du seed (npm run db:seed) : une collection, deux
 * catégories, deux matières. À remplacer par le vrai catalogue (admin, ou
 * content/<id>/categories.json). Le site lit la base, pas ce fichier.
 */
type CategorySeed = Pick<CategoryMeta, "slug" | "name" | "description" | "image">;

export const collections: Collection[] = [
  {
    slug: "essentiels",
    name: "Les Essentiels",
    season: "Toute l'année",
    tagline: "Les incontournables",
    description: "Collection de démonstration : les pièces à retrouver toute l'année.",
    heroImage: { src: "", alt: "Les Essentiels" },
  },
];

export const categories: CategorySeed[] = [
  {
    slug: "nouveautes",
    name: "Nouveautés",
    description: "Catégorie de démonstration : les dernières arrivées.",
    image: { src: "", alt: "Nouveautés" },
  },
  {
    slug: "accessoires",
    name: "Accessoires",
    description: "Catégorie de démonstration : accessoires.",
    image: { src: "", alt: "Accessoires" },
  },
];

export const materials: MaterialMeta[] = [
  { slug: "coton", name: "Coton", description: "Matière naturelle et respirante." },
  { slug: "lin", name: "Lin", description: "Matière légère au tombé fluide." },
];
