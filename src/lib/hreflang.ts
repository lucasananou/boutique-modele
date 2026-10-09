import { originForLocale, siteUrl } from "./site";
import { defaultLocale, localizedPath, type Locale } from "./i18n";
import { localeEnabled } from "@/stores";

/**
 * Alternates de langue pour un chemin canonique français.
 *
 * Les URLs sont absolues et peuvent pointer vers un autre domaine : c'est le
 * cas dès que la répartition multi-domaine est active. La réciprocité est
 * impérative — si une version déclare les autres sans être déclarée en retour,
 * Google ignore le groupe entier.
 *
 * `x-default` désigne la version servie à un visiteur dont la langue ne
 * correspond à aucune version : l'anglais international, et non le français.
 */
export function languageAlternates(path: string, currentOrigin: string = siteUrl) {
  const normalized = path.startsWith("/") ? path : `/${path}`;

  const url = (locale: Locale) =>
    `${originForLocale(locale, currentOrigin)}${localizedPath(normalized, locale)}`;

  // Seules les langues activées par la boutique (config.locales) sont
  // déclarées ; une boutique monolingue n'a pas d'alternates.
  const enabled = (["en", "he"] as const).filter((l) => localeEnabled(l));
  if (!enabled.length) return { fr: url(defaultLocale) };
  return {
    fr: url(defaultLocale),
    ...Object.fromEntries(enabled.map((l) => [l, url(l)])),
    "x-default": url(enabled.includes("en") ? "en" : defaultLocale),
  };
}
