import { isAdminAnalyticsPath } from "@/lib/analytics/ignore";

/*
 * Google Analytics 4 — configuration + e-commerce events.
 * Activé seulement si NEXT_PUBLIC_GA_ID est un ID GA4 valide (« G-XXXX »).
 * Sans ID, toutes les fonctions sont des no-op (aucun script chargé).
 */
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";
export const gaEnabled = GA_ID.startsWith("G-");

type Gtag = (command: string, ...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: Gtag;
    dataLayer?: unknown[];
  }
}

/** Item au format GA4 e-commerce (prix en euros, pas en centimes). */
export interface GaItem {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
  item_category?: string;
  item_variant?: string;
}

/** Construit un item GA4 depuis un produit/ligne (price en CENTIMES → euros). */
export function gaItem(p: {
  slug: string;
  name: string;
  priceCents: number;
  category?: string;
  variantLabel?: string;
  quantity?: number;
}): GaItem {
  return {
    item_id: p.slug,
    item_name: p.name,
    price: Math.round(p.priceCents) / 100,
    quantity: p.quantity ?? 1,
    ...(p.category ? { item_category: p.category } : {}),
    ...(p.variantLabel ? { item_variant: p.variantLabel } : {}),
  };
}

export function pageview(url: string): void {
  if (!gaEnabled || typeof window === "undefined" || !window.gtag) return;
  if (isAdminAnalyticsPath(url)) return;
  window.gtag("event", "page_view", { page_path: url });
}

/** Envoie un event GA4 (no-op si GA désactivé). */
export function trackEvent(
  name: string,
  params: Record<string, unknown> = {},
): void {
  if (!gaEnabled || typeof window === "undefined" || !window.gtag) return;
  if (isAdminAnalyticsPath(window.location.pathname)) return;
  window.gtag("event", name, params);
}

/** Somme des valeurs d'items (euros) pour le champ `value`. */
export function itemsValue(items: GaItem[]): number {
  return Math.round(items.reduce((s, i) => s + i.price * i.quantity, 0) * 100) / 100;
}
