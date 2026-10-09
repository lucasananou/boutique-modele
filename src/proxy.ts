/*
 * Proxy Next.js (ex-« middleware », renommé en Proxy depuis Next.js 16 :
 * fichier `proxy.ts` à la racine de `src`, fonction exportée `proxy`).
 *
 * Trois rôles :
 *   1. router les langues entre les domaines (français sur le `.fr`, anglais et
 *      hébreu sur le domaine international) ;
 *   2. réécrire les préfixes `/en` et `/he` vers les pages existantes, en
 *      transmettant la langue via `x-store-locale` ;
 *   3. empêcher l'indexation de ce qui ne doit pas l'être (environnements hors
 *      production, et traductions tant qu'elles ne sont pas relues).
 *
 * Le `matcher` exclut les assets, `robots.txt`, `sitemap.xml` et les routes API :
 * seules les pages HTML sont concernées.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { localeFromPathname } from "@/lib/i18n";
import {
  hostForLocale,
  hostProfile,
  intlIndexable,
  multiDomain,
  normalizeHost,
  servesLocale,
} from "@/lib/domains";
import { localeEnabled, store } from "@/stores";

/** Domaines de production réellement indexables. */
const PROD_HOSTS = new Set(
  [
    process.env.NEXT_PUBLIC_DOMAIN_FR || store.domains.primary,
    process.env.NEXT_PUBLIC_DOMAIN_INTL ?? "",
  ]
    .map(normalizeHost)
    .filter(Boolean),
);

function isProductionHost(host: string | null): boolean {
  return PROD_HOSTS.has(normalizeHost(host));
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Hôte demandé : derrière le reverse-proxy, l'hôte public est dans
  // `x-forwarded-host` ; repli sur l'en-tête `host` classique.
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");

  const profile = hostProfile(host);
  const locale = localeFromPathname(pathname);
  const isPrefixedLocale = locale !== "fr";

  // --- 0. Langue non activée pour cette boutique (config.locales) → page
  // française équivalente. ---
  if (isPrefixedLocale && !localeEnabled(locale)) {
    const target = request.nextUrl.clone();
    target.pathname = pathname.replace(/^\/(en|he)(?=\/|$)/, "") || "/";
    return NextResponse.redirect(target, 301);
  }

  // --- 1. Racine nue du domaine international → sa langue principale ---
  if (profile.rootRedirect && pathname === "/") {
    const target = request.nextUrl.clone();
    target.pathname = `/${profile.rootRedirect}`;
    return NextResponse.redirect(target, 301);
  }

  // --- 2. Langue servie par l'autre domaine → 301, chemin conservé ---
  // Le `.fr` ne sert que le français, le domaine international que l'anglais et
  // l'hébreu. Une seule version par langue : pas de duplicate entre domaines.
  if (multiDomain && profile.hostname && !servesLocale(profile, locale)) {
    const targetHost = hostForLocale(locale);
    if (targetHost && targetHost !== profile.hostname) {
      const target = request.nextUrl.clone();
      target.host = targetHost;
      target.port = "";
      target.protocol = "https";
      return NextResponse.redirect(target, 301);
    }
  }

  // --- 3. Réécriture des préfixes vers les pages existantes ---
  // L'URL affichée conserve `/en` ou `/he`, la page résolue est la page
  // française correspondante, qui lit la langue dans `x-store-locale`.
  const response = isPrefixedLocale
    ? (() => {
        const destination = request.nextUrl.clone();
        destination.pathname = pathname.replace(/^\/(en|he)(?=\/|$)/, "") || "/";
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("x-store-locale", locale);
        return NextResponse.rewrite(destination, { request: { headers: requestHeaders } });
      })()
    : (() => {
        // En-tête interne : jamais accepté tel qu'envoyé par le navigateur.
        const requestHeaders = new Headers(request.headers);
        requestHeaders.delete("x-store-locale");
        return NextResponse.next({ request: { headers: requestHeaders } });
      })();

  // --- 4. Indexation ---
  if (!isProductionHost(host)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  if (isPrefixedLocale) {
    if (!intlIndexable) {
      response.headers.set("X-Robots-Tag", "noindex, nofollow");
    }
    response.headers.set("Content-Language", locale);
  }

  return response;
}

export const config = {
  // Toutes les pages SAUF les fichiers techniques et les routes API.
  // `_next` (build assets + optimisation d'images), fichiers statiques du
  // dossier public (favicon, robots.txt, sitemap.xml, images…) et `/api/*`
  // sont laissés passer sans en-tête pour ne rien casser.
  matcher: [
    // `.html` en fait partie : les fichiers de vérification de propriété
    // (Google Search Console…) déposés dans `public/` doivent être servis
    // intacts, sans passer par la redirection de langue.
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|css|js|mjs|txt|xml|html|woff2?)$).*)",
  ],
};
