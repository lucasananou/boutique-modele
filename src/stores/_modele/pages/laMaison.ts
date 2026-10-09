/* Textes de la page /la-maison (modèle neutre, à adapter). */
import type { Locale } from "@/lib/i18n";

const fr: { title: string; description: string; heroTitle: string; subtitle: string; storyEyebrow: string; storyTitle: string; story1: string; story2: string; processEyebrow: string; processTitle: string; steps: string[][]; commitmentsEyebrow: string; commitmentsTitle: string; commitments: string[]; cta: string } = {
  title: "Notre histoire — __NOM__",
  description: "À REMPLIR : une phrase qui présente __NOM__.",
  heroTitle: "À REMPLIR : titre de la page",
  subtitle: "À REMPLIR : sous-titre de la page.",
  storyEyebrow: "Notre histoire",
  storyTitle: "À REMPLIR : titre de l'histoire",
  story1: "À REMPLIR : premier paragraphe (origine du projet).",
  story2: "À REMPLIR : second paragraphe (ce qui vous distingue).",
  processEyebrow: "Notre exigence",
  processTitle: "Comment nous sélectionnons nos produits",
  steps: [
    ["01", "Sélection", "À REMPLIR."],
    ["02", "Contrôle", "À REMPLIR."],
    ["03", "Préparation", "À REMPLIR."],
    ["04", "Livraison", "À REMPLIR."],
  ],
  commitmentsEyebrow: "Nos engagements",
  commitmentsTitle: "À REMPLIR : titre des engagements",
  commitments: ["Engagement 1", "Engagement 2", "Engagement 3", "Engagement 4"],
  cta: "Découvrir la boutique",
};

/* Les langues non activées (config.locales) reprennent le français. */
export const copy = { fr, en: fr, he: fr } satisfies Record<Locale, typeof fr>;
