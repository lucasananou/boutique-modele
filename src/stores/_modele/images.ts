import type { StoreConfig } from "../types";

/*
 * Visuels hors catalogue (accueil, pages éditoriales). À REMPLIR avec des URLs
 * Cloudinary du dossier « __ID__ ». En attendant : l'image générée par
 * src/app/opengraph-image.tsx (nom + couleurs de la boutique).
 */
const placeholder = "/opengraph-image";

export const images: StoreConfig["images"] = {
  hero: placeholder,
  gallery: [placeholder],
  categories: {},
  collections: {},
};
