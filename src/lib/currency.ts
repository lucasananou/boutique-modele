import { localeConfig, type Locale } from "./i18n";
import { store } from "@/stores";

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
  // La devise du catalogue (config `catalogCurrency`, euro par défaut) n'est
  // jamais convertie : une boutique en dollars facture ses prix tels quels.
  if (currency === catalogCurrency) return eurCents;
  const base = catalogCurrency === "EUR" ? eurCents : eurCents / RULES[catalogCurrency].rate;
  const rule = RULES[currency];
  if (currency === "EUR" || rule.rate === 1) return Math.round(base);
  const raw = base * rule.rate;
  return Math.max(rule.step, Math.round(raw / rule.step) * rule.step);
}

/** Inverse de `convertFromEur`, pour ramener un encaissement dans la devise du catalogue. */
export function convertToEur(minorUnits: number, currency: Currency): number {
  if (currency === catalogCurrency) return minorUnits;
  const eur = currency === "EUR" ? minorUnits : minorUnits / RULES[currency].rate;
  return Math.round(catalogCurrency === "EUR" ? eur : eur * RULES[catalogCurrency].rate);
}

/** Devise de saisie du catalogue (config `catalogCurrency`, défaut EUR). */
export const catalogCurrency: Currency = store.catalogCurrency ?? "EUR";

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
