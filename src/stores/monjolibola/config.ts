import type { StoreConfig } from "../types";
import { images } from "./images";
import { nav } from "./nav";
import { redirects } from "./redirects";
import { translations } from "./translations";
import { pages } from "./pages";

/*
 * Mon Joli Bola (préproduction bola.orylis.fr). Généré par `npm run store:new` : toutes les valeurs
 * marquées « À REMPLIR » doivent être relues avant la mise en ligne.
 * Référence complète et commentée : src/stores/types.ts.
 */
export const config: StoreConfig = {
  id: "monjolibola",
  // NE PLUS CHANGER une fois en ligne (consentement cookies, panier, chat).
  storagePrefix: "monjolibola",

  // Langues servies : français seul par défaut. Ajouter "en" / "he" après
  // avoir traduit translations.ts et pages/ (voir docs/NOUVELLE-BOUTIQUE.md).
  locales: ["fr"],

  // Blocs optionnels (textes « À REMPLIR » dans translations.ts).
  sections: {
    productHighlights: false,
    valuesBand: false,
    homeFaq: false,
  },

  brand: {
    name: "Mon Joli Bola",
    citySuffix: "",
    legalName: "Mon Joli Bola",
    tagline: "Le bola, un bijou qui tisse déjà un lien.",
    manifesto: "Le bola est un bijou délicat et symbolique, porté long pendant la grossesse.",
    localizedMeta: {
      en: { tagline: "Mon Joli Bola", description: "Mon Joli Bola" },
      he: { tagline: "Mon Joli Bola", description: "Mon Joli Bola" },
    },
    contact: {
      phone: "",
      email: "",
      address: { street: "", zip: "", city: "", country: "France" },
    },
    social: { instagram: "", pinterest: "" },
    announcements: [],
    announcement: "",
    locale: "fr-FR",
    currency: "EUR",
    commitments: [],
  },

  // Vendeur légal : null tant que Lucas n'a pas décidé (voir MISE-EN-PRODUCTION.md). Obligatoire avant toute vente.
  seller: null,

  hosting: {
    name: "OVH SAS",
    address: "2 rue Kellermann, 59100 Roubaix, France",
    url: "https://www.ovhcloud.com",
  },

  // Médiateur de la consommation : obligatoire pour vendre en France, à renseigner au lancement.
  mediator: null,

  domains: { primary: "bola.orylis.fr", intl: "" },

  emailFromFallback: "Mon Joli Bola <commandes@bola.orylis.fr>",

  orders: { prefix: "MJB" },

  commerce: {
    country: "FR",
    // Délais, frais et expéditeur à fixer par Lucas : rien n'est affiché tant que les commandes sont fermées.
    handlingDays: [1, 2],
    transitDays: [2, 4],
    returnDays: 14,
    freeReturns: false,
    shipsTo: ["FR"],
    shipping: { flatRate: 0, freeOver: 0, label: "Livraison en France" },
  },


  emailTheme: {
    outer: "#EBDDCA",
    card: "#FCF8F2",
    header: "#5B1420",
    headerText: "#FCF8F2",
    ink: "#3B2024",
    text: "#3B2024",
    muted: "#6F5A58",
    accent: "#5B1420",
    headingFont: "Georgia,serif",
  },

  front: {
    locale: "fr",
    paths: {
      signIn: "/compte/connexion",
      account: "/compte",
      checkout: "/commande",
      confirmation: "/commande/confirmation",
      manageSubscription: "/compte",
    },
    passthrough: ["/robots.txt", "/sitemap.xml"],
    sitemap: ["/", "/boutique", "/concept", "/histoire", "/faq", "/mentions-legales", "/cgv", "/confidentialite", "/retractation"],
  },

  promos: { cartRecoveryCode: "", cartRecoveryPercent: 0 },

  cloudinaryFolder: "monjolibola",

  // Couleurs : clés de src/app/globals.css (--color-*). Palette neutre à adapter.
  theme: {
    colors: {
      ivory: "#F6EFE5",
      "ivory-light": "#FCF8F2",
      mineral: "#EBDDCA",
      sand: "#EBDDCA",
      "sand-soft": "#DCCDB8",
      champagne: "#5B1420",
      "champagne-light": "#D9C3B0",
      "champagne-pale": "#B08D57",
      "warm-700": "#3B2024",
      "warm-500": "#6F5A58",
      "warm-400": "#857270",
      "warm-300": "#9C8B88",
      ink: "#3B2024",
      "ink-deep": "#5B1420",
      "ink-soft": "#EBDDCA",
    },
  },

  catalog: {
    categoryTitleSuffix: { fr: "Mon Joli Bola", en: "Mon Joli Bola", he: "Mon Joli Bola" },
    crossSellCategories: [],
  },

  nav,
  translations,
  pages,
  redirects,
  images,

  defaultCategory: { slug: "clairs", name: "Clairs" },
  defaultCollection: { slug: "bolas", name: "Nos bolas" },
};
