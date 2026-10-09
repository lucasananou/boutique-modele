"use client";

import { createContext, useContext } from "react";
import type { AdminPrefs } from "@/lib/adminPrefs";
import { DEFAULT_ADMIN_PREFS } from "@/lib/adminPrefs";

export interface AdminPrefsContextValue {
  prefs: AdminPrefs;
  /** true une fois les prefs lues depuis localStorage (post-montage). */
  ready: boolean;
  setPref: <K extends keyof AdminPrefs>(key: K, value: AdminPrefs[K]) => void;
  toggle: (key: keyof AdminPrefs) => void;
}

const AdminPrefsContext = createContext<AdminPrefsContextValue>({
  prefs: DEFAULT_ADMIN_PREFS,
  ready: false,
  setPref: () => {},
  toggle: () => {},
});

export const AdminPrefsProvider = AdminPrefsContext.Provider;

export function useAdminPrefs(): AdminPrefsContextValue {
  return useContext(AdminPrefsContext);
}
