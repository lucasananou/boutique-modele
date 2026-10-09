import type { Product } from "@/lib/types";

/*
 * Produits de DÉMONSTRATION du seed (npm run db:seed) : trois fiches neutres,
 * sans photo (un emplacement dessiné s'affiche). À supprimer dès que le vrai
 * catalogue est saisi dans l'admin.
 */
export type SeedProduct = Omit<Product, "categoryName" | "collectionName" | "sku" | "stock">;

const sizes = ["S", "M", "L", "XL"].map((s) => ({ id: s.toLowerCase(), label: s, available: true }));

export const products: SeedProduct[] = [
  {
    id: "produit-demo-a",
    slug: "produit-demo-a",
    name: "Produit démo A",
    price: 4900,
    category: "nouveautes",
    collection: "essentiels",
    materials: ["coton"],
    materialLabel: "Coton",
    shortDescription: "Description courte de démonstration.",
    description: "Description longue de démonstration.\n\nRemplacez ce produit par votre catalogue.",
    details: [{ label: "Composition", value: "100 % coton" }],
    images: [{ src: "", alt: "Produit démo A" }],
    variants: sizes,
    badge: "Nouveauté",
    iconic: true,
    inStock: true,
  },
  {
    id: "produit-demo-b",
    slug: "produit-demo-b",
    name: "Produit démo B",
    price: 6900,
    compareAtPrice: 7900,
    category: "nouveautes",
    collection: "essentiels",
    materials: ["lin"],
    materialLabel: "Lin",
    shortDescription: "Description courte de démonstration.",
    description: "Description longue de démonstration.",
    details: [{ label: "Composition", value: "100 % lin" }],
    images: [{ src: "", alt: "Produit démo B" }],
    variants: sizes,
    inStock: true,
  },
  {
    id: "produit-demo-c",
    slug: "produit-demo-c",
    name: "Produit démo C",
    price: 2900,
    category: "accessoires",
    collection: "essentiels",
    materials: ["coton"],
    materialLabel: "Coton",
    shortDescription: "Accessoire de démonstration, taille unique.",
    description: "Description longue de démonstration.",
    details: [],
    images: [{ src: "", alt: "Produit démo C" }],
    variants: [],
    inStock: true,
  },
];
