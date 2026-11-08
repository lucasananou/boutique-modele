import type { StoreConfig } from "../types";

/* Anciennes URL de mon-joli-bola.fr (site Next/Nest remplacé). */
export const redirects: StoreConfig["redirects"] = [
  { source: "/products/:slug", destination: "/produit/:slug", permanent: true },
  { source: "/collections/:slug", destination: "/boutique", permanent: true },
  { source: "/cart", destination: "/panier", permanent: true },
  { source: "/checkout", destination: "/commande", permanent: true },
  { source: "/login", destination: "/compte/connexion", permanent: true },
  { source: "/register", destination: "/compte/inscription", permanent: true },
  { source: "/account", destination: "/compte", permanent: true },
  { source: "/contact", destination: "/faq", permanent: true },
  { source: "/guide-des-tailles", destination: "/faq", permanent: true },
  { source: "/journal", destination: "/concept", permanent: true },
  { source: "/journal/:slug", destination: "/concept", permanent: true },
  { source: "/legal/mentions-legales", destination: "/mentions-legales", permanent: true },
  { source: "/legal/conditions-generales-de-vente", destination: "/cgv", permanent: true },
  { source: "/legal/politique-de-confidentialite", destination: "/confidentialite", permanent: true },
  { source: "/legal/politique-de-remboursement", destination: "/retractation", permanent: true },
  { source: "/legal/politique-d-expedition", destination: "/cgv", permanent: true },
];
