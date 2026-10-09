"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * Évite les écarts d'hydratation pour les valeurs issues de localStorage
 * (panier, favoris) : retourne false au rendu serveur et au premier rendu
 * client (hydratation), puis true côté client.
 *
 * Implémenté avec useSyncExternalStore (snapshot serveur=false, client=true)
 * plutôt qu'un setState dans un effet : pas de re-render en cascade, conforme
 * à la règle react-hooks/set-state-in-effect.
 */
export function useHasMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
