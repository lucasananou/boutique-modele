"use client";

import Script from "next/script";

/*
 * Emplacement des pixels publicitaires (Meta, TikTok). INACTIFS tant que les
 * identifiants ne sont pas fournis au build :
 *   NEXT_PUBLIC_META_PIXEL_ID, NEXT_PUBLIC_TIKTOK_PIXEL_ID
 * Sans identifiant, rien n'est chargé et `trackPixel` ne fait rien.
 * À prévoir avant activation : bandeau de consentement si la cible le
 * requiert (États avec loi « opt-out » : lien « Do not sell or share »),
 * et l'API Conversions côté serveur (webhook Stripe → Meta / TikTok).
 */

const META = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";
const TIKTOK = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID ?? "";

type PixelEvent = "PageView" | "ViewContent" | "AddToCart" | "InitiateCheckout" | "Purchase";

const TIKTOK_NAMES: Record<PixelEvent, string> = {
  PageView: "Pageview",
  ViewContent: "ViewContent",
  AddToCart: "AddToCart",
  InitiateCheckout: "InitiateCheckout",
  Purchase: "CompletePayment",
};

/** Envoie un événement aux pixels chargés (aucun effet si aucun pixel). */
export function trackPixel(event: PixelEvent, data?: { value?: number; currency?: string }) {
  if (typeof window === "undefined") return;
  const w = window as unknown as {
    fbq?: (...a: unknown[]) => void;
    ttq?: { track: (...a: unknown[]) => void };
  };
  try {
    if (META && w.fbq) w.fbq("track", event, data);
    if (TIKTOK && w.ttq && event !== "PageView") w.ttq.track(TIKTOK_NAMES[event], data);
  } catch {
    /* un pixel ne doit jamais casser l'achat */
  }
}

export default function Pixels() {
  if (!META && !TIKTOK) return null;
  return (
    <>
      {META && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META}');fbq('track','PageView');`}
        </Script>
      )}
      {TIKTOK && (
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=d.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${TIKTOK}');ttq.page();}(window,document,'ttq');`}
        </Script>
      )}
    </>
  );
}
