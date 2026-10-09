/* Page de Boutique Démo (npm run store:new) : réécrire les valeurs « À REMPLIR ». */
/* Textes de la page /services/sur-mesure (modèle neutre, à adapter ou retirer du menu). */
import type { Locale } from "@/lib/i18n";

const fr: { title: string; description: string; eyebrow: string; subtitle: string; cta: string; imageAlt: string; steps: string[][] } = {
  title: "Service personnalisé",
  description: "À REMPLIR : décrivez votre service (retouches, personnalisation, sur-mesure…).",
  eyebrow: "Service",
  subtitle: "À REMPLIR : deux phrases qui présentent le service.",
  cta: "Nous contacter",
  imageAlt: "Service personnalisé",
  steps: [
    ["01", "Votre demande", "Décrivez-nous votre besoin."],
    ["02", "Conseil", "Nous vous orientons vers la solution la plus adaptée."],
    ["03", "Devis & validation", "Vous recevez un devis et validez avant tout travail."],
    ["04", "Réalisation", "Nous réalisons votre demande avec soin."],
  ],
};

/* Les langues non activées (config.locales) reprennent le français. */
export const copy = { fr, en: fr, he: fr } satisfies Record<Locale, typeof fr>;
