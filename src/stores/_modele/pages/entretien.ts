/* Textes de la page /entretien (modèle neutre, à adapter). */
import type { Locale } from "@/lib/i18n";

const fr: { title: string; description: string; eyebrow: string; heroTitle: string; subtitle: string; sections: string[][]; contact: string; link: string } = {
  title: "Entretien de vos produits",
  description: "Nos conseils pour entretenir vos produits et les garder longtemps.",
  eyebrow: "Conseils",
  heroTitle: "Entretenir vos produits",
  subtitle: "Quelques gestes simples pour que vos pièces gardent leur tenue, leur couleur et leur douceur, saison après saison.",
  sections: [
    ["Avant tout : lisez l'étiquette", "Chaque matière a ses préférences. L'étiquette indique la température idéale, le mode de séchage et de repassage. En cas de doute, choisissez toujours le geste le plus doux."],
    ["Le lavage", "Lavez à 30 degrés quand c'est possible, retournez les pièces sur l'envers, triez les couleurs et placez les matières délicates dans un filet."],
    ["Le séchage", "Le séchage à l'air libre reste le meilleur choix. Posez la maille à plat et suspendez les autres pièces à l'ombre."],
    ["Le rangement", "Rangez vos pièces parfaitement sèches, pliées ou sur des cintres larges."],
  ],
  contact: "Une question sur un produit en particulier ?",
  link: "Écrivez-nous",
};

/* Les langues non activées (config.locales) reprennent le français. */
export const copy = { fr, en: fr, he: fr } satisfies Record<Locale, typeof fr>;
