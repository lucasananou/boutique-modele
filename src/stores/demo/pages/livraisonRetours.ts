/* Page de Boutique Démo (npm run store:new) : réécrire les valeurs « À REMPLIR ». */
/* Textes de la page /livraison-retours (modèle neutre, à adapter). */
import type { Locale } from "@/lib/i18n";

const fr: Record<string, string | string[]> = {
  title: "Livraison & retours",
  description: "Livraison suivie, retours sous 30 jours.",
  eyebrow: "Informations",
  subtitle: "Chaque commande est préparée avec soin, expédiée avec suivi et reprise sous trente jours.",
  h2Shipping: "Livraison",
  shippingP1: "Votre commande est expédiée sous 48 à 72 h après validation. Vous choisissez la livraison en point relais ou à domicile.",
  shippingItems: ["France métropolitaine : 2 à 4 jours ouvrés.", "Union européenne : 3 à 6 jours ouvrés.", "À REMPLIR : autres destinations.", "Suivi de colis transmis dès l'expédition."],
  shippingP2: "Un numéro de suivi vous est communiqué par e-mail dès la prise en charge du colis.",
  h2Returns: "Retours & échanges",
  returnsP: "Vous disposez de 30 jours pour changer d'avis. Contactez-nous et nous vous indiquons la marche à suivre pour votre retour.",
  returnsItems: ["Les articles doivent être non portés, non lavés, avec leurs étiquettes d'origine.", "Remboursement sous 14 jours après réception et contrôle.", "Pour un changement de taille, l'échange est possible dans la limite des stocks disponibles."],
  h2Payment: "Paiement",
  paymentP: "Réglez votre commande par carte bancaire, directement au moment du paiement.",
};

/* Les langues non activées (config.locales) reprennent le français. */
export const copy = { fr, en: fr, he: fr } satisfies Record<Locale, typeof fr>;
