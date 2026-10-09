/* Textes de la page /rendez-vous (contact) — modèle neutre, à adapter. */
import type { Locale } from "@/lib/i18n";

const fr: Record<string, string> = {
  title: "Nous contacter",
  description: "Une question sur un produit, une taille ou une commande ? Écrivez-nous : notre équipe vous répond.",
  eyebrow: "Conseil personnalisé",
  subtitle: "Une hésitation sur la taille ou une question sur un produit ? Écrivez-nous : notre équipe vous accompagne.",
  contactEyebrow: "Nous joindre",
  body: "Posez-nous vos questions : nous vous aidons à choisir le produit qui vous convient.",
  response: "Réponse sous 24 h, du lundi au vendredi.",
  whatsapp: "À REMPLIR : autre moyen de contact (WhatsApp, téléphone…).",
};

/* Les langues non activées (config.locales) reprennent le français. */
export const pageCopy = { fr, en: fr, he: fr } satisfies Record<Locale, typeof fr>;
