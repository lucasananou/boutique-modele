/**
 * Adresses de livraison : pays livrés (config `commerce.shipsTo`) et règles
 * propres aux États-Unis (État obligatoire, ZIP à 5 chiffres). Partagé par le
 * formulaire de la vitrine et par l'API de checkout, qui revalide tout.
 */
import { store } from "@/stores";

/** 50 États + district de Columbia (les territoires et APO/FPO ne sont pas livrés). */
export const US_STATES: readonly [code: string, name: string][] = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"],
  ["CA", "California"], ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"],
  ["DC", "District of Columbia"], ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"],
  ["ID", "Idaho"], ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"],
  ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"],
  ["MD", "Maryland"], ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"],
  ["MS", "Mississippi"], ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"],
  ["NV", "Nevada"], ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"],
  ["NY", "New York"], ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"],
  ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"],
  ["SC", "South Carolina"], ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"],
  ["UT", "Utah"], ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"],
  ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"],
];

const US_STATE_CODES = new Set(US_STATES.map(([c]) => c));

export interface ShippingAddressInput {
  fullName: string;
  line1: string;
  line2?: string;
  zip: string;
  city: string;
  state?: string;
  country: string;
  phone?: string;
}

/** Pays livrés par la boutique, ou null si la saisie du pays est libre. */
export function shipsTo(): readonly string[] | null {
  return store.commerce.shipsTo?.length ? store.commerce.shipsTo : null;
}

/**
 * Valide (et normalise) une adresse selon les pays livrés. Renvoie un message
 * d'erreur en anglais si la boutique restreint les destinations, sinon null.
 */
export function validateShippingAddress(
  a: ShippingAddressInput,
): { ok: true; address: ShippingAddressInput } | { ok: false; error: string; field: string } {
  const allowed = shipsTo();
  if (!allowed) return { ok: true, address: a };
  const country = a.country.trim().toUpperCase();
  if (!allowed.includes(country)) {
    return { ok: false, field: "country", error: `We only ship to ${allowed.join(", ")} addresses for now.` };
  }
  if (country === "US") {
    const state = (a.state ?? "").trim().toUpperCase();
    if (!US_STATE_CODES.has(state)) {
      return { ok: false, field: "state", error: "Choose a US state." };
    }
    const zip = a.zip.trim();
    if (!/^\d{5}(-\d{4})?$/.test(zip)) {
      return { ok: false, field: "zip", error: "Enter a 5-digit US ZIP code." };
    }
    if (/\b(p\.?\s*o\.?\s*box|apo|fpo|dpo)\b/i.test(`${a.line1} ${a.line2 ?? ""}`)) {
      return { ok: false, field: "line1", error: "We can't ship to PO boxes or military addresses yet." };
    }
    return { ok: true, address: { ...a, country, state, zip } };
  }
  return { ok: true, address: { ...a, country } };
}
