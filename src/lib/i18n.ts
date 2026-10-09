/**
 * Internationalisation foundation.
 *
 * French deliberately has no URL prefix: existing French URLs are SEO assets
 * and must remain unchanged. English and Hebrew will use /en and /he.
 */
export const locales = ["fr", "en", "he"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "fr";

export const localeConfig: Record<Locale, {
  htmlLang: string;
  dir: "ltr" | "rtl";
  currency: string;
  intlLocale: string;
}> = {
  fr: { htmlLang: "fr-FR", dir: "ltr", currency: "EUR", intlLocale: "fr-FR" },
  en: { htmlLang: "en", dir: "ltr", currency: "USD", intlLocale: "en-US" },
  he: { htmlLang: "he-IL", dir: "rtl", currency: "ILS", intlLocale: "he-IL" },
};

/** Add a locale prefix only for non-French routes. */
export function localizedPath(path: string, locale: Locale): string {
  const unprefixed = stripLocalePrefix(path);
  const normalized = unprefixed.startsWith("/") ? unprefixed : `/${unprefixed}`;
  return locale === defaultLocale ? normalized : `/${locale}${normalized === "/" ? "" : normalized}`;
}

/** Read a supported locale from a prefixed pathname. French is the fallback. */
export function localeFromPathname(pathname: string): Locale {
  const segment = pathname.split("/")[1];
  return segment === "en" || segment === "he" ? segment : defaultLocale;
}

/** Remove /en or /he from an internal URL while preserving query/hash. */
export function stripLocalePrefix(path: string): string {
  if (!path) return "/";
  if (/^(https?:|mailto:|tel:|#)/.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return normalized.replace(/^\/(en|he)(?=\/|$)/, "") || "/";
}
