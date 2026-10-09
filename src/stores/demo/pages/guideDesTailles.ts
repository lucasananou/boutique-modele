/* Page de Boutique Démo (npm run store:new) : réécrire les valeurs « À REMPLIR ». */
/* Textes de la page /guide-des-tailles (modèle neutre, à adapter). */
import type { Locale } from "@/lib/i18n";

/** [Taille, FR, Poitrine (cm), Taille (cm), Hanches (cm)] — indicatif, à adapter. */
export const sizeRows = [
  ["S", "36 - 38", "84 - 88", "66 - 70", "92 - 96"],
  ["M", "38 - 40", "88 - 92", "70 - 74", "96 - 100"],
  ["L", "40 - 42", "92 - 98", "74 - 80", "100 - 106"],
  ["XL", "44 - 46", "98 - 104", "80 - 86", "106 - 112"],
];

const fr: { title: string; description: string; eyebrow: string; heroTitle: string; subtitle: string; measureTitle: string; measure: string; headers: string[]; lengthsTitle: string; lengths: string[][]; help: string; contact: string } = {
  title: "Guide des tailles",
  description: "Trouvez votre taille grâce à notre tableau de mensurations.",
  eyebrow: "Bien choisir",
  heroTitle: "Guide des tailles",
  subtitle: "Quelques repères pour trouver la taille qui vous va.",
  measureTitle: "Prendre vos mesures",
  measure: "Munissez-vous d'un mètre ruban. Mesurez votre tour de poitrine, votre tour de taille et votre tour de hanches, puis reportez-vous au tableau. En cas d'hésitation entre deux tailles, choisissez la plus grande.",
  headers: ["Taille", "FR", "Poitrine (cm)", "Taille (cm)", "Hanches (cm)"],
  lengthsTitle: "Longueurs & coupes",
  lengths: [
    ["Longueurs", "La longueur exacte de chaque pièce est indiquée sur sa fiche produit."],
    ["Coupe", "À REMPLIR : précisez la coupe habituelle de vos pièces (ajustée, ample…)."],
  ],
  help: "Un doute sur votre taille ?",
  contact: "Nous contacter",
};

/* Les langues non activées (config.locales) reprennent le français. */
export const copy = { fr, en: fr, he: fr } satisfies Record<Locale, typeof fr>;
