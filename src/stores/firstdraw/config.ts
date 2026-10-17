import type { StoreConfig } from "../types";
import { images } from "./images";
import { nav } from "./nav";
import { redirects } from "./redirects";
import { translations } from "./translations";
import { pages } from "./pages";

/*
 * FIRST DRAW (firstdrawco.com). Généré par `npm run store:new` : toutes les valeurs
 * marquées « À REMPLIR » doivent être relues avant la mise en ligne.
 * Référence complète et commentée : src/stores/types.ts.
 */
export const config: StoreConfig = {
  id: "firstdraw",
  // NE PLUS CHANGER une fois en ligne (consentement cookies, panier, chat).
  storagePrefix: "firstdraw",

  // Vitrine sur mesure en anglais (src/stores/firstdraw/front) : les pages
  // publiques du modèle ne sont pas servies. "fr" reste la langue de l'admin.
  locales: ["fr"],

  sections: {
    productHighlights: false,
    valuesBand: false,
    homeFaq: false,
  },

  brand: {
    name: "FIRST DRAW",
    citySuffix: "",
    legalName: "MAISON ANANOU - F.Z.E",
    tagline: "Colostrum for the modern morning",
    manifesto:
      "Grass-fed bovine colostrum with the number printed on the jar: 575 mg of IgG per serving, one origin, a test report for every lot.",
    localizedMeta: {
      en: {
        tagline: "Colostrum for the modern morning",
        description:
          "Grass-fed bovine colostrum with the number printed on the jar: 575 mg of IgG per serving, one origin, a test report for every lot.",
      },
      he: { tagline: "FIRST DRAW", description: "FIRST DRAW" },
    },
    contact: {
      phone: "",
      // Domaine firstdrawco.com pas encore acheté : boîte à créer avant la mise en vente.
      email: "support@firstdrawco.com",
      address: { street: "", zip: "", city: "", country: "United Arab Emirates" },
    },
    social: { instagram: "", pinterest: "" },
    announcements: ["Free shipping on orders over $50", "60-day money-back guarantee"],
    announcement: "Free shipping on orders over $50",
    locale: "en-US",
    currency: "USD",
    commitments: ["575 mg IgG per serving", "One origin, tested lot by lot", "60-day guarantee"],
  },

  seller: {
    name: "MAISON ANANOU - F.Z.E",
    form: "Free Zone Establishment",
    authority: "Ajman Free Zone Authority",
    registration: "License no. 40574",
    address: "Office C1-1F-SF10271, Ajman Free Zone C1 Building, Ajman, United Arab Emirates",
    director: "",
    email: "support@firstdrawco.com",
  },

  hosting: {
    name: "OVH SAS",
    address: "2 rue Kellermann, 59100 Roubaix, France",
    url: "https://www.ovhcloud.com",
  },

  // Vente aux États-Unis uniquement : pas de médiateur de la consommation français.
  mediator: null,

  domains: { primary: "firstdrawco.com", intl: "" },

  emailFromFallback: "FIRST DRAW <orders@firstdrawco.com>",

  orders: { prefix: "FD" },

  catalogCurrency: "USD",

  commerce: {
    country: "US",
    handlingDays: [0, 2],
    transitDays: [2, 5],
    returnDays: 60,
    freeReturns: false,
    shipsTo: ["US"],
    // 5,95 $ sous 50 $ (seul le pot unique en achat simple est concerné) ;
    // offert dès 50 $ et sur tout abonnement. À valider par Lucas.
    shipping: { flatRate: 595, freeOver: 5000, label: "Standard shipping (2 to 5 business days)" },
  },

  subscriptions: {
    discountPercent: 18,
    intervals: [30, 60, 90],
    freeShipping: true,
  },

  fulfillment: {
    partner: "Supliful",
    dashboardUrl: "https://app.supliful.com",
    note:
      "Supliful ne se branche qu'à Shopify / ClickFunnels : chaque commande payée se passe à la main depuis leur tableau de bord (Order products → Colostrum Powder, SKU JTP10COPO, nombre de pots ci-dessous, adresse du client). Marquez-la « transmise », puis saisissez le numéro de suivi quand Supliful l'envoie : la cliente reçoit l'e-mail d'expédition.",
    unitLabel: { one: "pot", many: "pots" },
  },

  emailTheme: {
    outer: "#E8EDF4",
    card: "#FFFFFF",
    header: "#0B1C42",
    headerText: "#FFFFFF",
    ink: "#0B1C42",
    text: "#3A4560",
    muted: "#8B94A6",
    accent: "#D99A00",
    headingFont: "'Arial Black',Arial,sans-serif",
  },

  front: {
    locale: "en",
    paths: {
      signIn: "/account/login",
      account: "/account",
      checkout: "/checkout",
      confirmation: "/checkout/success",
      manageSubscription: "/account/subscription",
    },
    passthrough: [],
  },

  promos: { cartRecoveryCode: "WELCOME10", cartRecoveryPercent: 10 },

  cloudinaryFolder: "firstdraw",

  // Couleurs de l'admin et des pages du modèle (la vitrine a sa propre feuille).
  theme: {
    colors: {
      ivory: "#ffffff",
      "ivory-light": "#f7f9fc",
      mineral: "#f7f9fc",
      sand: "#e8edf4",
      "sand-soft": "#dde3ec",
      champagne: "#1d3a7c",
      "champagne-light": "#c9d2df",
      "champagne-pale": "#8b94a6",
      "warm-700": "#3a4560",
      "warm-500": "#5b6478",
      "warm-400": "#8b94a6",
      "warm-300": "#8b94a6",
      ink: "#0b1c42",
      "ink-deep": "#0b1c42",
      "ink-soft": "#e8edf4",
    },
  },

  catalog: {
    categoryTitleSuffix: { fr: "FIRST DRAW", en: "FIRST DRAW", he: "FIRST DRAW" },
    crossSellCategories: [],
  },

  nav,
  translations,
  pages,
  redirects,
  images,

  defaultCategory: { slug: "colostrum", name: "Colostrum" },
  defaultCollection: { slug: "first-draw", name: "FIRST DRAW" },
};
