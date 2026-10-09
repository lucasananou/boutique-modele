import { brand } from "./brand";
import type { Locale } from "./i18n";
import { convertFromEur, currencyFor, formatMoney } from "./currency";

/** Formate un prix exprimé en centimes vers la devise de la marque.
 *  Prêt-à-porter : 2 décimales (ex. « 59,50 € »). */
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat(brand.locale, {
    style: "currency",
    currency: brand.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * Formate un prix CATALOGUE, stocké en centimes d'euro, dans la devise du
 * marché : conversion à taux figé puis arrondi commercial (voir currency.ts).
 *
 * Pour un montant déjà libellé dans sa devise — une commande enregistrée — il
 * faut `formatMoney`, sinon le montant serait converti une seconde fois.
 */
export function formatPriceLocale(eurCents: number, locale: Locale = "fr"): string {
  const currency = currencyFor(locale);
  return formatMoney(convertFromEur(eurCents, currency), currency, locale);
}

/** Formate un prix avec décimales (utile pour le récapitulatif de commande). */
export function formatPricePrecise(cents: number): string {
  return new Intl.NumberFormat(brand.locale, {
    style: "currency",
    currency: brand.currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

/** Date longue en français (ex. « 4 août 2026 »). */
export function formatDateFr(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Centimes → valeur de champ de saisie admin, SANS arrondi (6990 → « 69,90 »).
 * Ne jamais arrondir à l'euro ici : le formulaire renvoie cette valeur telle
 * quelle à l'enregistrement.
 */
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

/**
 * Saisie admin en euros (« 69,90 », « 69.9 », « 69,90 € », « 1 069,90 ») →
 * centimes entiers. Renvoie null si la saisie est invalide ou négative.
 */
export function parseEuroInput(value: string): number | null {
  const cleaned = String(value ?? "")
    .replace(/[\s  €]/g, "")
    .replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [euros, decimals = ""] = cleaned.split(".");
  // Calcul entier : évite les erreurs de flottant (69.9 * 100 = 6990.000000000001).
  return Number(euros) * 100 + Number(decimals.padEnd(2, "0"));
}
