import { headers } from "next/headers";
import { hostForLocale } from "./domains";
import type { Locale } from "./i18n";

/**
 * URL publique de repli (sans slash final).
 *
 * ⚠️ Figée au build (`NEXT_PUBLIC_*`). Elle ne doit servir que de valeur par
 * défaut : dès qu'un rendu peut être servi sous plusieurs domaines, il faut
 * dériver l'origine de la requête, sinon le domaine international renverrait
 * des canonicals, un sitemap et des liens pointant vers le `.fr` — et Google
 * le désindexerait comme copie.
 */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

/** Construit une URL absolue à partir d'un chemin, sur une origine donnée. */
export function absoluteUrl(path = "/", origin: string = siteUrl): string {
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Origine réellement demandée (`https://exemple.com`), lue sur les
 * en-têtes transmis par le reverse proxy. Repli sur `siteUrl` hors requête.
 */
export async function requestOrigin(): Promise<string> {
  const h = await headers();
  const raw = h.get("x-forwarded-host") ?? h.get("host");
  if (!raw) return siteUrl;
  // `www.` est retiré : apex et www servent le même contenu, et une origine
  // dérivée de la requête les rendrait tous deux auto-canoniques — donc le site
  // entier dupliqué. Le canonical pointe toujours sur l'apex.
  const host = raw.replace(/^www\./i, "");
  const protocol = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

/**
 * Origine servant une langue donnée — utile aux liens inter-domaines
 * (hreflang, sélecteur de langue, e-mails). Retombe sur l'origine courante en
 * mode mono-domaine.
 */
export function originForLocale(locale: Locale, currentOrigin: string = siteUrl): string {
  const host = hostForLocale(locale);
  if (!host) return currentOrigin;
  const protocol = currentOrigin.startsWith("http://") ? "http" : "https";
  return `${protocol}://${host}`;
}
