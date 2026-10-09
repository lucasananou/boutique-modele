"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { FILTER_PARAM_KEYS } from "@/lib/filterKeys";

/**
 * Logique URL centralisée pour le catalogue : tous les filtres vivent dans la
 * query string (copiable, partageable, rechargeable). Aucun état de filtrage
 * local — la source de vérité est l'URL, le filtrage réel est fait côté serveur.
 */
export function useCatalogParams() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const get = (key: string) => params.get(key) ?? "";

  function commit(next: URLSearchParams) {
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  /**
   * Définit/efface une clé (valeur vide ou null → suppression).
   * Tout changement de filtre/tri REMET la pagination à la page 1 (on retire
   * `page`) : sinon on pourrait rester sur une page devenue vide après filtrage.
   */
  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (!value) next.delete(key);
    else next.set(key, value);
    if (key !== "page") next.delete("page");
    commit(next);
  }

  /** Bascule une valeur (re-cliquer la valeur active la désélectionne). */
  function toggleParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (next.get(key) === value) next.delete(key);
    else next.set(key, value);
    commit(next);
  }

  /**
   * Applique plusieurs changements de clés en UNE seule navigation :
   *  - `clearKeys` : clés à supprimer d'abord (ex. presets mutuellement exclusifs) ;
   *  - `set` : couples clé/valeur à poser (valeur null → suppression).
   * Utile pour les « filtres rapides » qui posent/retirent plusieurs params à la fois
   * sans enchaîner des setParam en série (qui liraient une URL périmée).
   */
  function setMany(set: [string, string | null][], clearKeys: string[] = []) {
    const next = new URLSearchParams(params.toString());
    for (const k of clearKeys) next.delete(k);
    for (const [k, v] of set) {
      if (!v) next.delete(k);
      else next.set(k, v);
    }
    // Un changement de filtre/tri repart toujours de la page 1.
    if (!set.some(([k]) => k === "page")) next.delete("page");
    commit(next);
  }

  /** Réinitialise tous les filtres (la catégorie de route reste via le chemin). */
  function clearAll() {
    router.push(pathname, { scroll: false });
  }

  /** Au moins un filtre actif ? */
  const hasActiveFilters = FILTER_PARAM_KEYS.some((k) => params.get(k));

  return {
    get,
    setParam,
    toggleParam,
    setMany,
    clearAll,
    hasActiveFilters,
    params,
  };
}
