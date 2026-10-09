/**
 * Transporteurs proposés dans l'admin (saisie du suivi colis) et lien de suivi
 * public. Le n° est encodé dans l'URL ; « autre » utilise le lien saisi à la main.
 */
export interface Carrier {
  key: string;
  label: string;
  /** Modèle d'URL : `{n}` est remplacé par le numéro de suivi. */
  url?: string;
}

export const carriers: Carrier[] = [
  { key: "colissimo", label: "Colissimo", url: "https://www.laposte.fr/outils/suivre-vos-envois?code={n}" },
  { key: "mondial-relay", label: "Mondial Relay", url: "https://www.mondialrelay.fr/suivi-de-colis/?numeroExpedition={n}" },
  { key: "chronopost", label: "Chronopost", url: "https://www.chronopost.fr/tracking-no-cms/suivi-page?listeNumerosLT={n}" },
  { key: "dpd", label: "DPD", url: "https://trace.dpd.fr/fr/trace/{n}" },
  { key: "gls", label: "GLS", url: "https://gls-group.com/FR/fr/suivi-colis?match={n}" },
  { key: "dhl", label: "DHL", url: "https://www.dhl.com/fr-fr/home/suivi.html?tracking-id={n}" },
  { key: "ups", label: "UPS", url: "https://www.ups.com/track?loc=fr_FR&tracknum={n}" },
  { key: "inpost", label: "InPost", url: "https://inpost.pl/sledzenie-przesylek?number={n}" },
  { key: "autre", label: "Autre transporteur" },
];

export function carrierLabel(key?: string | null): string {
  if (!key) return "";
  return carriers.find((c) => c.key === key)?.label ?? key;
}

/** Lien de suivi public, ou null si impossible à construire. */
export function trackingLink(
  carrier?: string | null,
  number?: string | null,
  customUrl?: string | null,
): string | null {
  if (customUrl && /^https?:\/\//i.test(customUrl)) return customUrl;
  const c = carriers.find((x) => x.key === carrier);
  if (!c?.url || !number) return null;
  return c.url.replace("{n}", encodeURIComponent(number.trim()));
}
