/** Navigation de la boutique active (src/stores/<id>/nav.ts). */
import { store } from "@/stores";
import type { Locale } from "@/lib/i18n";

export const { primaryNav, megaMenu, collectionsNav, seoGuidesNav, footerNav } = store.nav;

/** Libellé de navigation traduit (repli : libellé français). */
export function navLabel(label: string, locale: Locale): string {
  if (locale === "fr") return label;
  return store.nav.labels[label]?.[locale] ?? label;
}
