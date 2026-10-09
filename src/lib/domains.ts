import { defaultLocale, locales, type Locale } from "./i18n";
import { localeEnabled, store } from "@/stores";

/**
 * Répartition des langues entre les domaines.
 *
 * Le français reste sur le domaine historique (ccTLD `.fr`), qui porte tout le
 * SEO existant. L'anglais et l'hébreu passent sur un gTLD neutre : un `.fr` est
 * un signal géographique « France » que Google ne permet pas de neutraliser,
 * et qui pénalise durablement le marché américain.
 *
 * INACTIF PAR DÉFAUT : sans `NEXT_PUBLIC_DOMAIN_INTL`, tous les hôtes utilisent
 * le profil mono-domaine (les trois langues sur le même hôte, préfixes `/en` et
 * `/he`) — c'est-à-dire exactement le comportement actuel. Définir la variable
 * active la répartition, et rien d'autre ne change dans le code.
 */

// La répartition des domaines relève de l'architecture du site, pas de la
// configuration d'environnement : elle vit donc ici, avec les variables comme
// simple surcharge. Les hôtes inconnus (localhost, préprod, IP directe)
// retombent de toute façon sur le profil mono-domaine.
const FR_DOMAIN = normalizeHost(process.env.NEXT_PUBLIC_DOMAIN_FR || store.domains.primary);
const INTL_DOMAIN = normalizeHost(process.env.NEXT_PUBLIC_DOMAIN_INTL || store.domains.intl);

/** Vrai quand la répartition multi-domaine est activée. */
export const multiDomain = INTL_DOMAIN.length > 0;

/**
 * Les versions traduites restent hors index tant que leur contenu n'est pas
 * intégralement traduit et relu. Cette bascule pilote à la fois l'en-tête
 * `X-Robots-Tag` du proxy et l'inclusion des URLs dans le sitemap : les deux
 * doivent rester cohérents, un sitemap ne doit jamais lister du `noindex`.
 */
export const intlIndexable = process.env.NEXT_PUBLIC_ALLOW_INTL_INDEXING === "true";

export interface HostProfile {
  /** Hôte canonique, sans `www` ni port. Vide en mode mono-domaine. */
  hostname: string;
  /** Langues servies par cet hôte. */
  locales: readonly Locale[];
  /**
   * Langue vers laquelle rediriger la racine nue. Le domaine international
   * n'a pas de contenu à `/`, il envoie sur sa langue principale.
   */
  rootRedirect: Locale | null;
}

/**
 * Profil de repli : les trois langues sur un seul hôte, aucune redirection.
 * Sert en développement, en préproduction, sur une IP directe, et en
 * production tant que le domaine international n'est pas activé.
 */
const SINGLE_HOST: HostProfile = {
  hostname: "",
  locales: locales.filter((l) => localeEnabled(l)),
  rootRedirect: null,
};

const FR_HOST: HostProfile = {
  hostname: FR_DOMAIN,
  locales: [defaultLocale],
  rootRedirect: null,
};

const INTL_HOST: HostProfile = {
  hostname: INTL_DOMAIN,
  locales: (["en", "he"] as const).filter((l) => localeEnabled(l)),
  // L'anglais garde son préfixe `/en` : le servir à la racine imposerait de
  // faire circuler une « locale par défaut de l'hôte » dans tous les
  // constructeurs de liens, pour un gain purement cosmétique. Le signal marché
  // vient du TLD et du hreflang, pas du chemin.
  rootRedirect: "en",
};

/** Retire le `www.`, le port et la casse d'un en-tête `Host`. */
export function normalizeHost(host: string | null | undefined): string {
  if (!host) return "";
  return host.split(":")[0].trim().toLowerCase().replace(/^www\./, "");
}

/** Profil correspondant à un en-tête `Host`. */
export function hostProfile(host: string | null | undefined): HostProfile {
  if (!multiDomain) return SINGLE_HOST;
  const hostname = normalizeHost(host);
  if (hostname === FR_DOMAIN) return FR_HOST;
  if (hostname === INTL_DOMAIN) return INTL_HOST;
  // Préproduction, IP directe, localhost : tout sur un seul hôte.
  return SINGLE_HOST;
}

/** Hôte qui sert une langue donnée, ou `null` en mode mono-domaine. */
export function hostForLocale(locale: Locale): string | null {
  if (!multiDomain) return null;
  return locale === defaultLocale ? FR_DOMAIN : INTL_DOMAIN;
}

/** Vrai si l'hôte courant sert cette langue. */
export function servesLocale(profile: HostProfile, locale: Locale): boolean {
  return profile.locales.includes(locale);
}

/**
 * Lien vers une langue depuis un hôte donné : relatif si la langue est servie
 * par cet hôte, absolu sinon. Évite le 301 inutile du sélecteur de langue,
 * qui pointerait sinon vers une URL que le proxy renvoie aussitôt ailleurs.
 *
 * Utilisable côté client : ce module ne dépend que de variables `NEXT_PUBLIC_*`,
 * inlinées au build, sans jamais toucher à `next/headers`.
 */
export function crossDomainPath(
  path: string,
  target: Locale,
  currentHost: string | null | undefined,
): string {
  if (!multiDomain) return path;
  // Hôte non canonique (localhost, préprod, IP directe) : le profil de repli
  // sert toutes les langues, tout reste donc relatif. Sans ce garde-fou, le
  // sélecteur de langue enverrait un développeur droit sur la production.
  const profile = hostProfile(currentHost);
  if (!profile.hostname) return path;

  const to = hostForLocale(target);
  if (!to || to === profile.hostname) return path;
  return `https://${to}${path}`;
}
