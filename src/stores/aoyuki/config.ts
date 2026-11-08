import type { StoreConfig } from "../types";
import { images } from "./images";
import { nav } from "./nav";
import { redirects } from "./redirects";
import { translations } from "./translations";
import { pages } from "./pages";

/*
 * Aoyuki (aoyuki.orylis.fr). Généré par `npm run store:new` : toutes les valeurs
 * marquées « À REMPLIR » doivent être relues avant la mise en ligne.
 * Référence complète et commentée : src/stores/types.ts.
 */
export const config: StoreConfig = {
  id: "aoyuki",
  // NE PLUS CHANGER une fois en ligne (consentement cookies, panier, chat).
  storagePrefix: "aoyuki",

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
    name: "Aoyuki",
    citySuffix: "",
    legalName: "Aoyuki",
    tagline: "La neige verte du matin.",
    manifesto: "Un matcha de première récolte, d'un seul cultivar et d'une seule région, moulu à la pierre, et un hojicha doucement torréfié.",
    localizedMeta: {
      en: { tagline: "Aoyuki", description: "Aoyuki" },
      he: { tagline: "Aoyuki", description: "Aoyuki" },
    },
    contact: {
      phone: "",
      email: "contact@aoyuki.orylis.fr",
      address: { street: "", zip: "", city: "", country: "France" },
    },
    social: { instagram: "", pinterest: "" },
    announcements: ["Livraison offerte dès 45 €"],
    announcement: "Livraison offerte dès 45 €",
    locale: "fr-FR",
    currency: "EUR",
    commitments: ["Première récolte", "Un seul cultivar", "Moulu à la pierre"],
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

  domains: { primary: "aoyuki.orylis.fr", intl: "" },

  emailFromFallback: "Aoyuki <commandes@aoyuki.orylis.fr>",

  orders: { prefix: "AOY" },

  commerce: {
    country: "FR",
    // Délais à confirmer avec le fournisseur avant le lancement (MISE-EN-PRODUCTION.md).
    handlingDays: [1, 2],
    transitDays: [2, 4],
    returnDays: 14,
    freeReturns: false,
    shipsTo: ["FR"],
    // Seuil de 45 € donné par Lucas (08/11) ; frais de port sous le seuil à fixer :
    // 0 tant qu'ils ne sont pas décidés, aucun tarif inventé.
    shipping: { flatRate: 0, freeOver: 4500, label: "Livraison en France" },
  },

  subscriptions: {
    discountPercent: 10,
    intervals: [30, 45, 60],
    freeShipping: true,
  },

  emailTheme: {
    outer: "#F1E8D7",
    card: "#F7F1E5",
    header: "#102F23",
    headerText: "#F4EBDD",
    ink: "#1B2E25",
    text: "#3A4A40",
    muted: "#55645A",
    accent: "#102F23",
    headingFont: "Georgia,serif",
  },

  front: {
    locale: "fr",
    paths: {
      signIn: "/compte/connexion",
      account: "/compte",
      checkout: "/commande",
      confirmation: "/commande/confirmation",
      manageSubscription: "/compte/abonnement",
    },
    passthrough: [],
    sitemap: ["/", "/boutique", "/mentions-legales", "/cgv", "/confidentialite", "/retractation"],
  },

  promos: { cartRecoveryCode: "PANIER10", cartRecoveryPercent: 10 },

  cloudinaryFolder: "aoyuki",

  // Couleurs : clés de src/app/globals.css (--color-*). Palette neutre à adapter.
  theme: {
    colors: {
      ivory: "#F7F1E5",
      "ivory-light": "#F7F1E5",
      mineral: "#F1E8D7",
      sand: "#F1E8D7",
      "sand-soft": "#DCD2BE",
      champagne: "#102F23",
      "champagne-light": "#C9D1BE",
      "champagne-pale": "#8DA254",
      "warm-700": "#3A4A40",
      "warm-500": "#55645A",
      "warm-400": "#6F7C71",
      "warm-300": "#8A968B",
      ink: "#1B2E25",
      "ink-deep": "#102F23",
      "ink-soft": "#F1E8D7",
    },
  },

  catalog: {
    categoryTitleSuffix: { fr: "Aoyuki", en: "Aoyuki", he: "Aoyuki" },
    crossSellCategories: [],
  },

  nav,
  translations,
  pages,
  redirects,
  images,

  defaultCategory: { slug: "matcha", name: "Matcha" },
  defaultCollection: { slug: "aoyuki", name: "Aoyuki" },
};
