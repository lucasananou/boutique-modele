import type { StoreConfig } from "../types";
import { images } from "./images";
import { nav } from "./nav";
import { redirects } from "./redirects";
import { translations } from "./translations";
import { pages } from "./pages";

/*
 * Boutique Démo (exemple.fr). Généré par `npm run store:new` : toutes les valeurs
 * marquées « À REMPLIR » doivent être relues avant la mise en ligne.
 * Référence complète et commentée : src/stores/types.ts.
 */
export const config: StoreConfig = {
  id: "demo",
  // NE PLUS CHANGER une fois en ligne (consentement cookies, panier, chat).
  storagePrefix: "demo",

  // Langues servies : français seul par défaut. Ajouter "en" / "he" après
  // avoir traduit translations.ts et pages/ (voir docs/NOUVELLE-BOUTIQUE.md).
  locales: ["fr"],

  // Blocs optionnels (textes « À REMPLIR » dans translations.ts).
  sections: {
    productHighlights: false,
    valuesBand: false,
    homeFaq: true,
  },

  brand: {
    name: "Boutique Démo",
    citySuffix: "Paris", // À REMPLIR
    legalName: "Boutique Démo",
    tagline: "À REMPLIR : accroche courte", // À REMPLIR
    manifesto: "À REMPLIR : deux phrases qui présentent la boutique (description SEO de l'accueil).",
    localizedMeta: {
      en: { tagline: "TO FILL: short tagline", description: "TO FILL: two sentences describing the shop." },
      he: { tagline: "Boutique Démo", description: "Boutique Démo" },
    },
    contact: {
      phone: "", // À REMPLIR
      email: "contact@exemple.fr",
      address: { street: "", zip: "", city: "", country: "France" }, // À REMPLIR
    },
    social: { instagram: "", pinterest: "" },
    announcements: ["Livraison offerte dès 80 €", "Retours sous 30 jours"], // À REMPLIR
    announcement: "Livraison offerte dès 80 €",
    locale: "fr-FR",
    currency: "EUR",
    commitments: ["À REMPLIR", "À REMPLIR", "À REMPLIR"],
  },

  // Vendeur légal : null = pages légales minimales. À REMPLIR avant toute vente.
  seller: null,

  hosting: {
    name: "OVH SAS",
    address: "2 rue Kellermann, 59100 Roubaix, France",
    url: "https://www.ovhcloud.com",
  },

  // Médiateur de la consommation (obligatoire pour vendre en France). À REMPLIR.
  mediator: null,

  domains: { primary: "exemple.fr", intl: "" },

  emailFromFallback: "Boutique Démo <commandes@exemple.fr>",

  orders: { prefix: "CMD" },

  commerce: {
    country: "FR",
    handlingDays: [0, 1],
    transitDays: [2, 3],
    returnDays: 30,
    freeReturns: false,
  },

  promos: { cartRecoveryCode: "PANIER10", cartRecoveryPercent: 10 },

  cloudinaryFolder: "demo",

  // Couleurs : clés de src/app/globals.css (--color-*). Palette neutre à adapter.
  theme: {
    colors: {
      ivory: "#ffffff",
      "ivory-light": "#f8f8f6",
      mineral: "#f8f8f6",
      sand: "#efefec",
      "sand-soft": "#e6e6e2",
      champagne: "#4a4a46",
      "champagne-light": "#b9b9b2",
      "champagne-pale": "#9d9d96",
      "warm-700": "#4f4f4b",
      "warm-500": "#66665f",
      "warm-400": "#8f8f88",
      "warm-300": "#9d9d96",
      ink: "#141414",
      "ink-deep": "#141414",
      "ink-soft": "#efefec",
    },
  },

  catalog: {
    categoryTitleSuffix: { fr: "Boutique Démo", en: "Boutique Démo", he: "Boutique Démo" },
    crossSellCategories: [],
  },

  nav,
  translations,
  pages,
  redirects,
  images,

  defaultCategory: { slug: "nouveautes", name: "Nouveautés" },
  defaultCollection: { slug: "essentiels", name: "Essentiels" },
};
