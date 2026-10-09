"use client";

import Script from "next/script";
import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { GA_ID, gaEnabled, pageview } from "@/lib/analytics";
import { isAdminAnalyticsPath } from "@/lib/analytics/ignore";
import { useConsent } from "@/components/consent/ConsentProvider";

/** Envoie un page_view GA4 à chaque navigation client (SPA). */
function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    if (isAdminAnalyticsPath(pathname)) return;
    const qs = searchParams?.toString();
    pageview(pathname + (qs ? `?${qs}` : ""));
  }, [pathname, searchParams]);
  return null;
}

/**
 * Charge GA4 (gtag) et suit les pages. send_page_view=false : on envoie les
 * page_view manuellement (gère les navigations SPA Next). No-op sans GA_ID.
 *
 * RGPD : les scripts GA ne sont montés QUE si l'utilisateur a accepté les
 * cookies (`consent === "all"`). Le choix étant réactif, GA se charge dès le
 * clic sur « Accepter » sans rechargement, et ne se charge jamais en cas de
 * refus ou tant que le choix est inconnu.
 */
export function GoogleAnalytics() {
  const { consent } = useConsent();
  const pathname = usePathname();
  if (isAdminAnalyticsPath(pathname)) return null;
  if (!gaEnabled || consent !== "all") return null;
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { send_page_view: false });
        `}
      </Script>
      <Suspense fallback={null}>
        <PageviewTracker />
      </Suspense>
    </>
  );
}
