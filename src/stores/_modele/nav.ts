import type { StoreNav } from "../types";

/*
 * Navigation de __NOM__. Les catégories du menu doivent exister en base
 * (admin > Catégories, ou content/__ID__/categories.json au démarrage).
 */
export const nav: StoreNav = {
  primaryNav: [
    { label: "Boutique", href: "/boutique", hasMega: true },
    { label: "Nouveautés", href: "/boutique?tri=nouveautes" },
  ],
  megaMenu: {
    type: { title: "Par catégorie", links: [{ label: "Nouveautés", href: "/boutique?tri=nouveautes" }] },
    material: { title: "Collections", links: [{ label: "Les Essentiels", href: "/collection/essentiels" }] },
    service: {
      title: "Aide",
      links: [
        { label: "Guide des tailles", href: "/guide-des-tailles" },
        { label: "Livraison & retours", href: "/livraison-retours" },
        { label: "Nous contacter", href: "/rendez-vous" },
      ],
    },
    featured: {
      eyebrow: "Nouveautés",
      title: "Les Essentiels",
      href: "/collection/essentiels",
      cta: "Découvrir",
      image: "/opengraph-image", // À REMPLIR
    },
  },
  collectionsNav: [{ label: "Les Essentiels", href: "/collection/essentiels" }],
  seoGuidesNav: [],
  footerNav: {
    maison: {
      title: "La Maison",
      links: [
        { label: "Notre histoire", href: "/la-maison" },
        { label: "Journal", href: "/journal" },
        { label: "Nous contacter", href: "/rendez-vous" },
      ],
    },
    services: {
      title: "Aide",
      links: [
        { label: "Guide des tailles", href: "/guide-des-tailles" },
        { label: "Livraison & retours", href: "/livraison-retours" },
        { label: "Entretien", href: "/entretien" },
      ],
    },
    legal: [
      { label: "Mentions légales", href: "/mentions-legales" },
      { label: "CGV", href: "/cgv" },
      { label: "Confidentialité", href: "/confidentialite" },
    ],
  },
  labels: {
    Boutique: { en: "Shop", he: "חנות" },
    Nouveautés: { en: "New arrivals", he: "חדש באתר" },
    "Par catégorie": { en: "By category", he: "לפי קטגוריה" },
    Collections: { en: "Collections", he: "קולקציות" },
    "Les Essentiels": { en: "Essentials", he: "בסיס" },
    Aide: { en: "Help", he: "עזרה" },
    "Guide des tailles": { en: "Size guide", he: "מדריך מידות" },
    "Livraison & retours": { en: "Delivery & returns", he: "משלוחים והחזרות" },
    "Nous contacter": { en: "Contact us", he: "יצירת קשר" },
    "La Maison": { en: "About", he: "עלינו" },
    "Notre histoire": { en: "Our story", he: "הסיפור שלנו" },
    Journal: { he: "מגזין" },
    Entretien: { en: "Care", he: "טיפול בבגד" },
    "Mentions légales": { en: "Legal notice", he: "מידע משפטי" },
    CGV: { en: "Terms of sale", he: "תנאי מכירה" },
    Confidentialité: { en: "Privacy", he: "פרטיות" },
  },
};
