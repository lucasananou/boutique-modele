import { storageKey } from "@/stores";

/**
 * Préférences d'affichage du panneau admin.
 * Persistées dans localStorage (clé `<storagePrefix>:admin:prefs`) et appliquées en
 * direct via des attributs `data-*` posés sur `.admin-root` (voir AdminShell).
 *
 * Modèle : le layout par défaut est « menu en haut » (header sticky). Les
 * options largeur / compact / thème sont indépendantes.
 */

export const ADMIN_PREFS_KEY = storageKey("admin:prefs");

export interface AdminPrefs {
  /** Largeur pleine du conteneur de contenu (retire la contrainte max). */
  fullWidth: boolean;
  /** Espacements resserrés (main + cartes). */
  compact: boolean;
  /** Menu en haut (header sticky). Si false → sidebar verticale à gauche. */
  menuTop: boolean;
  /** Thème sombre de l'admin. */
  dark: boolean;
}

export const DEFAULT_ADMIN_PREFS: AdminPrefs = {
  fullWidth: false,
  compact: false,
  menuTop: true,
  dark: false,
};

/** Normalise une valeur inconnue (localStorage) en prefs valides. */
export function normalizeAdminPrefs(raw: unknown): AdminPrefs {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_ADMIN_PREFS };
  const r = raw as Partial<Record<keyof AdminPrefs, unknown>>;
  return {
    fullWidth:
      typeof r.fullWidth === "boolean"
        ? r.fullWidth
        : DEFAULT_ADMIN_PREFS.fullWidth,
    compact:
      typeof r.compact === "boolean" ? r.compact : DEFAULT_ADMIN_PREFS.compact,
    menuTop:
      typeof r.menuTop === "boolean" ? r.menuTop : DEFAULT_ADMIN_PREFS.menuTop,
    dark: typeof r.dark === "boolean" ? r.dark : DEFAULT_ADMIN_PREFS.dark,
  };
}

/** Lit les prefs depuis localStorage (safe SSR / erreurs). */
export function readAdminPrefs(): AdminPrefs {
  if (typeof window === "undefined") return { ...DEFAULT_ADMIN_PREFS };
  try {
    const raw = window.localStorage.getItem(ADMIN_PREFS_KEY);
    if (!raw) return { ...DEFAULT_ADMIN_PREFS };
    return normalizeAdminPrefs(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_ADMIN_PREFS };
  }
}

/** Écrit les prefs dans localStorage (silencieux en cas d'erreur). */
export function writeAdminPrefs(prefs: AdminPrefs): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ADMIN_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* quota / mode privé : on ignore */
  }
}

/**
 * Applique les prefs comme attributs `data-*` sur un élément (le `.admin-root`).
 * Utilisé par AdminShell et par le script anti-FOUC.
 */
export function applyAdminPrefsToEl(el: HTMLElement, prefs: AdminPrefs): void {
  el.setAttribute("data-theme", prefs.dark ? "dark" : "light");
  el.setAttribute("data-menu", prefs.menuTop ? "top" : "side");
  if (prefs.compact) el.setAttribute("data-compact", "");
  else el.removeAttribute("data-compact");
  if (prefs.fullWidth) el.setAttribute("data-fullwidth", "");
  else el.removeAttribute("data-fullwidth");
}
