/*
 * Identité de la boutique active — lue dans sa configuration
 * (src/stores/<id>/config.ts, sélectionnée par NEXT_PUBLIC_STORE_ID).
 * Ce module reste le point d'entrée historique : `import { brand }` partout.
 */
import { store } from "@/stores";

export const brand = store.brand;

export type Brand = typeof brand;
