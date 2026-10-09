// Utilitaire client — fire-and-forget vers /api/live/track.
// Importable depuis les stores Zustand ou composants client.

import { hasAnalyticsConsent } from "@/lib/consent";
import { shouldIgnoreAnalyticsPayload } from "@/lib/analytics/ignore";
import { storageKey } from "@/stores";

const STORAGE_KEY = storageKey("aid", "_");

export function getOrCreateAnonymousId(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

export type LiveEventType =
  | "PAGE_VIEW"
  | "PRODUCT_VIEW"
  | "ADD_TO_CART"
  | "REMOVE_FROM_CART"
  | "CART_UPDATE"
  | "BEGIN_CHECKOUT"
  | "PURCHASE"
  | "HEARTBEAT";

export interface TrackPayload {
  page?: string;
  referrer?: string;
  productId?: string;
  productName?: string;
  productSlug?: string;
  cartItemsCount?: number;
  cartValue?: number;
  orderValue?: number;
  orderRef?: string;
}

export function trackEvent(
  eventType: LiveEventType,
  payload: TrackPayload = {},
) {
  // RGPD : le tracking Live (mesure d'audience) exige le consentement « all ».
  // Sans consentement (refus ou choix inconnu) → aucun événement n'est envoyé.
  // Conséquence assumée : ces visiteurs n'apparaissent pas dans le dashboard
  // Live. Le mode démo admin (?demo=1) est alimenté séparément (useDemoStream)
  // et n'est donc pas affecté.
  if (!hasAnalyticsConsent()) return;
  if (
    shouldIgnoreAnalyticsPayload({
      page: payload.page ?? (typeof window !== "undefined" ? window.location.pathname : undefined),
      referrer: payload.referrer,
    })
  ) {
    return;
  }

  let anonymousId: string;
  try {
    anonymousId = getOrCreateAnonymousId();
  } catch {
    return;
  }

  fetch("/api/live/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ anonymousId, eventType, ...payload }),
    keepalive: true,
  }).catch(() => {});
}
