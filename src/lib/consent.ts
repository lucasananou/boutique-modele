import { storageKey } from "@/stores";

/*
 * Source de vérité du consentement cookies, partagée entre le contexte React
 * (`ConsentProvider`) et le code non-React (loader GA, `trackEvent`).
 *
 * On lit directement le localStorage pour que les fonctions fire-and-forget
 * (hors arbre React) puissent vérifier le consentement sans dépendance au
 * contexte.
 */

/** Clé de stockage du choix de consentement. */
export const CONSENT_STORAGE_KEY = storageKey("consent");

/**
 * Événement custom émis (même onglet) à chaque changement de choix, pour que
 * les lecteurs non-React se re-synchronisent immédiatement.
 */
export const CONSENT_EVENT = storageKey("consent-change");

/** `"all"` = tout accepté · `"essential"` = refusé (essentiels seulement). */
export type ConsentValue = "all" | "essential";

/** Lit le choix courant. `null` = inconnu (aucun choix fait) ou SSR. */
export function readConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    return raw === "all" || raw === "essential" ? raw : null;
  } catch {
    return null;
  }
}

/**
 * Le consentement aux traceurs analytics/mesure d'audience est-il accordé ?
 * Base légale des cookies GA + tracking Live → seul `"all"` l'autorise.
 */
export function hasAnalyticsConsent(): boolean {
  return readConsent() === "all";
}
