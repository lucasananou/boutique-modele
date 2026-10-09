import { storageKey } from "@/stores";

/*
 * État local de la capture d'e-mail au panier.
 * - e-mail déjà capturé → on n'affiche plus aucune sollicitation (persistant).
 * - popup exit-intent / bandeau rétention → une seule fois par session.
 */

const CAPTURED_KEY = storageKey("lead"); // localStorage (persistant)
const EXIT_KEY = storageKey("lead:exit"); // sessionStorage
const BANNER_KEY = storageKey("lead:banner"); // sessionStorage

export function hasCaptured(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return Boolean(localStorage.getItem(CAPTURED_KEY));
  } catch {
    return false;
  }
}

export function markCaptured(email: string): void {
  try {
    localStorage.setItem(CAPTURED_KEY, email);
  } catch {
    /* stockage indisponible : on ignore */
  }
}

export function exitShown(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return sessionStorage.getItem(EXIT_KEY) === "1";
  } catch {
    return true;
  }
}

export function markExitShown(): void {
  try {
    sessionStorage.setItem(EXIT_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function bannerSeen(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return sessionStorage.getItem(BANNER_KEY) === "1";
  } catch {
    return true;
  }
}

export function markBannerSeen(): void {
  try {
    sessionStorage.setItem(BANNER_KEY, "1");
  } catch {
    /* ignore */
  }
}
