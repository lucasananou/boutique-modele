import { localeConfig, type Locale } from "./i18n";

/**
 * Prix par marché.
 *
 * Le catalogue est stocké en centimes d'euro : c'est la référence unique. Les
 * autres devises en sont dérivées à taux FIGÉ, puis arrondies à l'unité — on
 * fabrique des prix de vente, pas une conversion financière. Un taux temps réel
 * ferait osciller les étiquettes d'un jour à l'autre, ce qu'aucune boutique ne
 * fait, et casserait la comparaison des statistiques.
 *
 * Ces taux sont donc à réviser à la main, quand le change dérive trop.
 */

export type Currency = "EUR" | "USD" | "ILS";

interface CurrencyRule {
  /** Multiplicateur appliqué au prix en euros. */
  rate: number;
  /** Pas d'arrondi, en unités mineures (100 = à l'euro/dollar/shekel près). */
  step: number;
}

const RULES: Record<Currency, CurrencyRule> = {
  EUR: { rate: 1, step: 1 },
  USD: { rate: 1.12, step: 100 },
  ILS: { rate: 4.15, step: 100 },
};

/** Devise servie pour une langue donnée. */
export function currencyFor(locale: Locale): Currency {
  return localeConfig[locale].currency as Currency;
}

/**
 * Convertit un montant du catalogue (centimes d'euro) vers les unités mineures
 * de la devise cible. L'euro n'est jamais touché : aucun arrondi parasite sur
 * le marché historique.
 */
export function convertFromEur(eurCents: number, currency: Currency): number {
  const rule = RULES[currency];
  if (currency === "EUR" || rule.rate === 1) return eurCents;
  const raw = eurCents * rule.rate;
  return Math.max(rule.step, Math.round(raw / rule.step) * rule.step);
}

/** Inverse de `convertFromEur`, pour ramener un encaissement en base euro. */
export function convertToEur(minorUnits: number, currency: Currency): number {
  const rule = RULES[currency];
  if (currency === "EUR" || rule.rate === 1) return minorUnits;
  return Math.round(minorUnits / rule.rate);
}

/**
 * Formate un montant DÉJÀ exprimé dans sa devise (commande enregistrée,
 * statistiques). Pour un prix catalogue, passer par `formatPriceLocale`, qui
 * convertit d'abord.
 */
export function formatMoney(
  minorUnits: number,
  currency: Currency | string,
  locale: Locale = "fr",
): string {
  const code = String(currency).toUpperCase();
  return new Intl.NumberFormat(localeConfig[locale].intlLocale, {
    style: "currency",
    currency: code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(minorUnits / 100);
}
