import type { StoreConfig } from "./types";
import { store as selected } from "./current";

/*
 * Boutique active : src/stores/current.ts, généré avant chaque build par
 * scripts/select-store.mjs à partir de NEXT_PUBLIC_STORE_ID. Seule cette
 * boutique est compilée. Ajouter une boutique : `npm run store:new`.
 */
const expected = (process.env.NEXT_PUBLIC_STORE_ID || selected.id).trim().toLowerCase();
if (expected !== selected.id) {
  throw new Error(
    `NEXT_PUBLIC_STORE_ID="${expected}" mais src/stores/current.ts pointe vers « ${selected.id} » : lancer node scripts/select-store.mjs`,
  );
}

/** Configuration de la boutique active. */
export const store: StoreConfig = selected;

/** Clé de stockage navigateur propre à la boutique (`<prefixe>:consent`…). */
export function storageKey(name: string, separator = ":"): string {
  return `${store.storagePrefix}${separator}${name}`;
}

/** Variables CSS du thème (`--color-*`) à injecter sur :root. */
export function themeCss(): string {
  const vars = Object.entries(store.theme.colors)
    .filter(([k, v]) => /^[a-z0-9-]+$/.test(k) && /^#[0-9a-fA-F]{3,8}$|^rgba?\([\d\s.,%]+\)$/.test(v))
    .map(([k, v]) => `--color-${k}:${v};`)
    .join("");
  return vars ? `:root{${vars}}` : "";
}

export type { StoreConfig };

/** Langue activée pour la boutique (le français l'est toujours). */
export function localeEnabled(locale: string): boolean {
  return locale === "fr" || (store.locales as readonly string[]).includes(locale);
}
