"use client";

/*
 * Gestion du consentement cookies (RGPD / CNIL).
 *
 * État persisté dans localStorage sous la clé `<storagePrefix>:consent` :
 *   - clé absente      → choix INCONNU (le bandeau s'affiche)
 *   - "all"            → l'utilisateur a ACCEPTÉ (GA + tracking Live actifs)
 *   - "essential"      → l'utilisateur a REFUSÉ (aucun traceur non essentiel)
 *
 * Le gating concret (GA, trackEvent) lit ce même localStorage via
 * `hasAnalyticsConsent()` dans `@/lib/consent`, de sorte que le code non-React
 * (store, fire-and-forget) puisse aussi vérifier le consentement.
 */

import {
  createContext,
  useContext,
  useCallback,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  CONSENT_EVENT,
  CONSENT_STORAGE_KEY,
  readConsent,
  type ConsentValue,
} from "@/lib/consent";

interface ConsentContextValue {
  /** `null` tant que le choix n'est pas connu (SSR + premier rendu client). */
  consent: ConsentValue | null;
  /** L'utilisateur a-t-il fait un choix ? (sinon → afficher le bandeau) */
  decided: boolean;
  /** Accepte tous les traceurs (analytics + tracking Live). */
  acceptAll: () => void;
  /** Refuse : seuls les cookies essentiels restent. */
  rejectAll: () => void;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

function persist(value: ConsentValue) {
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, value);
  } catch {
    /* localStorage indisponible (mode privé strict) → non bloquant */
  }
  // Notifie les lecteurs non-React (GA loader, trackEvent) dans le même onglet.
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CONSENT_EVENT));
  }
}

/**
 * Abonnement aux changements de choix : l'événement `storage` couvre les AUTRES
 * onglets, `CONSENT_EVENT` l'onglet courant.
 */
function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === CONSENT_STORAGE_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CONSENT_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CONSENT_EVENT, onChange);
  };
}

/** Le serveur ne connaît pas le localStorage : choix inconnu au rendu HTML. */
const serverSnapshot = () => null;

export function ConsentProvider({ children }: { children: ReactNode }) {
  /*
   * `useSyncExternalStore` plutôt qu'un `useState` initialisé depuis le
   * localStorage : cet ancien montage faisait diverger le premier rendu client
   * du HTML serveur (serveur « choix inconnu » → bandeau ; client « déjà
   * accepté » → pas de bandeau). React abandonnait alors l'hydratation de ce
   * sous-arbre, laissant un bandeau ORPHELIN dans le DOM — visible, mais sans
   * gestionnaire de clic : « Accepter » ne faisait plus rien et le bandeau
   * restait à l'écran. Ici le rendu d'hydratation utilise le snapshot serveur,
   * donc il colle au HTML, et React remplace proprement au rendu suivant.
   */
  const consent = useSyncExternalStore(subscribe, readConsent, serverSnapshot);

  // `persist` émet CONSENT_EVENT : l'abonnement ci-dessus relit et déclenche le
  // rendu. Pas d'état local à tenir en parallèle, donc pas de désynchronisation.
  const acceptAll = useCallback(() => persist("all"), []);
  const rejectAll = useCallback(() => persist("essential"), []);

  return (
    <ConsentContext.Provider
      value={{
        consent,
        decided: consent === "all" || consent === "essential",
        acceptAll,
        rejectAll,
      }}
    >
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) {
    throw new Error("useConsent doit être utilisé dans <ConsentProvider>.");
  }
  return ctx;
}
