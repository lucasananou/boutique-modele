"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  ADMIN_PREFS_KEY,
  DEFAULT_ADMIN_PREFS,
  applyAdminPrefsToEl,
  readAdminPrefs,
  writeAdminPrefs,
  type AdminPrefs,
} from "@/lib/adminPrefs";
import { AdminPrefsProvider } from "./AdminPrefsContext";
import { AdminNav } from "./AdminNav";

// Effet de layout côté client ; no-op côté serveur (évite le warning SSR).
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Provider client de l'admin. Vit À L'INTÉRIEUR du wrapper `.admin-root`
 * (rendu, lui, par le server component `layout.tsx`, qui porte aussi le script
 * anti-FOUC). Ici : lecture localStorage, application des `data-*` sur le
 * wrapper parent, persistance, et rendu de la nav + du conteneur de contenu.
 *
 * On NE rend PAS de `<script>` (interdit dans un composant client) et on NE
 * rend PAS le wrapper `.admin-root` (c'est le layout serveur qui le fait).
 */
export function AdminShell({
  adminName,
  children,
}: {
  adminName: string;
  children: ReactNode;
}) {
  // Le wrapper `.admin-root` est rendu par le layout serveur (id="admin-root").
  const rootElRef = useRef<HTMLElement | null>(null);
  const [prefs, setPrefs] = useState<AdminPrefs>(DEFAULT_ADMIN_PREFS);
  const [ready, setReady] = useState(false);

  // Résout le wrapper `.admin-root` puis lit les prefs stockées.
  useIsoLayoutEffect(() => {
    rootElRef.current = document.getElementById("admin-root");
    const stored = readAdminPrefs();
    setPrefs(stored);
    setReady(true);
    // Applique immédiatement (le script anti-FOUC l'a déjà fait, mais on
    // resynchronise au cas où le storage aurait changé depuis le SSR).
    if (rootElRef.current) applyAdminPrefsToEl(rootElRef.current, stored);
  }, []);

  // À chaque changement de prefs (après montage) : applique + persiste.
  useIsoLayoutEffect(() => {
    if (!ready) return;
    if (rootElRef.current) applyAdminPrefsToEl(rootElRef.current, prefs);
    writeAdminPrefs(prefs);
  }, [prefs, ready]);

  // Synchronise entre onglets.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === ADMIN_PREFS_KEY) setPrefs(readAdminPrefs());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setPref = useCallback(
    <K extends keyof AdminPrefs>(key: K, value: AdminPrefs[K]) => {
      setPrefs((p) => ({ ...p, [key]: value }));
    },
    [],
  );

  const toggle = useCallback((key: keyof AdminPrefs) => {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  }, []);

  return (
    <AdminPrefsProvider value={{ prefs, ready, setPref, toggle }}>
      <AdminNav adminName={adminName} />
      <main className="flex-1 min-w-0">
        <div data-ad-content className="px-6 pt-11 pb-28">
          {children}
        </div>
      </main>
    </AdminPrefsProvider>
  );
}
