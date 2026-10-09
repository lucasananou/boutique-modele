"use client";

import { useTracker } from "@/hooks/useTracker";

/** Composant client sans rendu — se monte dans le layout shop pour le tracking live. */
export function LiveTracker() {
  useTracker();
  return null;
}
