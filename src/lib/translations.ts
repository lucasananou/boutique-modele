import type { Locale } from "./i18n";
import { store } from "@/stores";
import type { StoreTranslations } from "@/stores/types";

/** Textes de l'interface de la boutique active (src/stores/<id>/translations.ts). */
export type UiCopy = StoreTranslations["fr"];

export function t(locale: Locale): UiCopy {
  return store.translations[locale] as UiCopy;
}

export function interpolate(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""));
}
