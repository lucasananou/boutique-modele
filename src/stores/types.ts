import type { Locale } from "@/lib/i18n";
import type { pages as modelePages } from "./_modele/pages";
import type { translations as modeleTranslations } from "./_modele/translations";

/** Type « élargi » : mêmes clés, littéraux → string (schéma de référence : src/stores/_modele). */
export type Widen<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly Widen<U>[]
    : T extends object
      ? { -readonly [K in keyof T]: Widen<T[K]> }
      : T;

/** Textes des pages d'information (/la-maison, /entretien…), par boutique. */
export type StorePages = Widen<typeof modelePages>;

/** Textes de l'interface (fr/en/he), par boutique. */
export type StoreTranslations = Widen<typeof modeleTranslations>;

/**
 * Configuration STATIQUE d'une boutique (versionnée dans Git, relue en PR).
 * Tout ce qui distingue une boutique d'une autre et ne se modifie pas en ligne
 * vit ici ; le catalogue, les commandes et les clientes vivent dans SA base.
 *
 * Boutique active : variable `NEXT_PUBLIC_STORE_ID` (inlinée au build, donc un
 * build par boutique — c'est le cas avec une app Coolify par boutique).
 * Voir src/stores/index.ts et docs/NOUVELLE-BOUTIQUE.md.
 */
export interface NavLink {
  label: string;
  href: string;
  image?: string;
  hasMega?: boolean;
}

/** Navigation de la boutique (libellés en français, traductions dans `labels`). */
export interface StoreNav {
  primaryNav: NavLink[];
  megaMenu: {
    type: { title: string; links: NavLink[] };
    material: { title: string; links: NavLink[] };
    service: { title: string; links: NavLink[] };
    featured: { eyebrow: string; title: string; href: string; cta: string; image: string };
  };
  collectionsNav: NavLink[];
  seoGuidesNav: NavLink[];
  footerNav: {
    maison: { title: string; links: NavLink[] };
    services: { title: string; links: NavLink[] };
    legal: NavLink[];
  };
  /** Libellé français → traductions. */
  labels: Record<string, { en?: string; he?: string }>;
}

export interface StoreConfig {
  /** Identifiant technique (minuscules, sans espace) = dossier src/stores/<id>. */
  id: string;
  /**
   * Préfixe des clés localStorage / sessionStorage / événements navigateur
   * (consentement cookies, chat, panier…). NE PAS CHANGER une fois en ligne :
   * les visiteuses perdraient leur consentement et leur conversation.
   */
  storagePrefix: string;

  /**
   * Langues servies. Le français (sans préfixe d'URL) est toujours inclus ;
   * `en` (/en) et `he` (/he, RTL) ne sont activées que si listées ici ET
   * traduites dans translations.ts / pages/. Une langue non listée renvoie
   * (301) vers la page française et disparaît du sélecteur, du sitemap et
   * des hreflang.
   */
  locales: readonly Locale[];

  /** Blocs optionnels de l'interface (textes dans translations.ts). */
  sections: {
    /** Bloc « points forts » de la fiche produit (product.highlights*). */
    productHighlights: boolean;
    /** Bande « engagements » de l'accueil (homePage.values). */
    valuesBand: boolean;
    /** FAQ de l'accueil + balisage FAQPage (homePage.faq). */
    homeFaq: boolean;
  };

  /** Identité affichée (header, footer, SEO, e-mails, pages légales). */
  brand: {
    name: string;
    /** Sous-titre du logo texte (lockup « NOM · VILLE »). */
    citySuffix: string;
    /** Nom affiché comme éditeur dans le pied des e-mails et le JSON-LD. */
    legalName: string;
    tagline: string;
    manifesto: string;
    /** Titre/description SEO du site en anglais et en hébreu (fr = tagline + manifesto). */
    localizedMeta: Record<"en" | "he", { tagline: string; description: string }>;
    contact: {
      phone: string;
      email: string;
      address: { street: string; zip: string; city: string; country: string };
    };
    social: { instagram: string; pinterest: string };
    announcements: readonly string[];
    announcement: string;
    locale: string;
    currency: string;
    commitments: readonly string[];
  };

  /**
   * Vendeur légal (mentions légales, CGV, confidentialité, rétractation).
   * `null` : pages légales minimales (boutique en cours de création).
   * Ne JAMAIS y mettre de données personnelles sensibles (passeport, IBAN…).
   */
  seller: {
    /** Dénomination sociale. */
    name: string;
    /** Forme juridique. */
    form: string;
    /** Registre / autorité d'immatriculation. */
    authority: string;
    /** N° d'immatriculation ou de licence. */
    registration: string;
    capital?: string;
    /** Adresse du siège. */
    address: string;
    /** Représentant légal / directeur de la publication. */
    director: string;
    /** E-mail de contact légal (repli : brand.contact.email). */
    email?: string;
    /** N° de TVA (absent : non affiché). */
    vatNumber?: string;
  } | null;

  /** Hébergeur du site (mentions légales, LCEN). */
  hosting: { name: string; address: string; url: string };

  /**
   * Médiateur de la consommation (art. L612-1 C. conso.) : nom, adresse, site.
   * `null` : aucune mention (à désigner — obligation légale pour vendre à des
   * consommateurs en France).
   */
  mediator: { name: string; address: string; url: string } | null;

  /** Domaines de production (surchargeables par NEXT_PUBLIC_DOMAIN_FR / _INTL). */
  domains: {
    /** Domaine principal (langue par défaut), sans protocole ni www. */
    primary: string;
    /** Domaine international (en/he), "" si aucun. */
    intl: string;
  };

  /** Expéditeur des e-mails si EMAIL_FROM n'est pas défini. */
  emailFromFallback: string;

  orders: {
    /** Préfixe des références de commande (ex. « CMD » → CMD-2026-0001). */
    prefix: string;
  };

  /** Livraison et retours (JSON-LD Offer / MerchantReturnPolicy). */
  commerce: {
    country: string;
    handlingDays: [number, number];
    transitDays: [number, number];
    returnDays: number;
    freeReturns: boolean;
  };

  promos: {
    /** Code créé/activé à la 3e relance de panier abandonné. */
    cartRecoveryCode: string;
    cartRecoveryPercent: number;
  };

  /** Dossier racine Cloudinary des images de la boutique. */
  cloudinaryFolder: string;

  /**
   * Thème : valeurs des tokens couleur de src/app/globals.css (`--color-*`).
   * Injectées sur :root par le layout racine ; une clé absente garde la valeur
   * par défaut de globals.css.
   */
  theme: { colors: Record<string, string> };

  catalog: {
    /** Suffixe du <title> des pages catégorie (« Robes — <suffixe> »). */
    categoryTitleSuffix: Record<"fr" | "en" | "he", string>;
    /**
     * Catégories proposées en « souvent acheté avec » tant que l'historique de
     * commandes est trop mince (slugs). Vide : aucune suggestion de repli.
     */
    crossSellCategories: readonly string[];
  };

  nav: StoreNav;

  /** Textes de l'interface (src/stores/<id>/translations.ts). */
  translations: StoreTranslations;

  /** Textes des pages d'information (src/stores/<id>/pages/). */
  pages: StorePages;

  /** Redirections 301 (next.config.ts) : anciennes URLs de la boutique. */
  redirects: { source: string; destination: string; permanent: boolean }[];

  /** Visuels du site (accueil, pages éditoriales) hors catalogue. */
  images: {
    hero: string;
    gallery: string[];
    /** Visuels par slug de catégorie (pages éditoriales). */
    categories: Record<string, string>;
    collections: Record<string, string>;
  };

  /** Catégorie créée par défaut si la base n'en a aucune (brouillon produit). */
  defaultCategory: { slug: string; name: string };
  defaultCollection: { slug: string; name: string };
}
