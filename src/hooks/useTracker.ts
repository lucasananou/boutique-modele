"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useCart, selectCount, selectSubtotal } from "@/lib/store/cart";
import { trackEvent } from "@/lib/live/client";
import { isAdminAnalyticsPath } from "@/lib/analytics/ignore";
import { useConsent } from "@/components/consent/ConsentProvider";

const HEARTBEAT_MS = 30_000;

export function useTracker() {
  const pathname = usePathname();
  const cartCount = useCart(selectCount);
  const cartValue = useCart(selectSubtotal);
  const prevPath = useRef<string | null>(null);
  // RGPD : n'active le tracking qu'une fois le consentement « all » donné.
  // `trackEvent` re-vérifie aussi le consentement (défense en profondeur),
  // mais on garde ici pour ne poser ni intervalle ni page_view sans accord.
  const { consent } = useConsent();
  const granted = consent === "all";
  const shouldTrack = granted && !isAdminAnalyticsPath(pathname);

  // Page view au changement de route (une fois le consentement accordé, hors admin).
  // `shouldTrack` en dépendance : dès l'acceptation, la page courante est envoyée.
  useEffect(() => {
    if (!shouldTrack) return;
    if (pathname === prevPath.current) return;
    prevPath.current = pathname;
    // Referrer envoyé une seule fois au premier chargement
    const referrer = typeof document !== "undefined" && document.referrer
      ? document.referrer
      : undefined;
    trackEvent("PAGE_VIEW", { page: pathname, referrer });
  }, [pathname, shouldTrack]);

  // Heartbeat pour maintenir la session active (seulement si consentement).
  useEffect(() => {
    if (!shouldTrack) return;
    const id = setInterval(() => {
      trackEvent("HEARTBEAT", {
        page: pathname,
        cartItemsCount: cartCount,
        cartValue,
      });
    }, HEARTBEAT_MS);
    return () => clearInterval(id);
  }, [pathname, cartCount, cartValue, shouldTrack]);
}
