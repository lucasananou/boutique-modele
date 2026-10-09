"use client";

import { useEffect } from "react";
import { useLiveStore } from "@/store/live";
import { makeDemoSnapshot } from "@/lib/live/demo";

/** Alimente le store avec des données factices toutes les 3 s (mode ?demo=1). */
export function useDemoStream(enabled: boolean) {
  const setSnapshot = useLiveStore((s) => s.setSnapshot);
  const setConnected = useLiveStore((s) => s.setConnected);

  useEffect(() => {
    if (!enabled) return;
    const push = () => {
      setSnapshot(makeDemoSnapshot());
      setConnected(true);
    };
    push();
    const id = setInterval(push, 3000);
    return () => clearInterval(id);
  }, [enabled, setSnapshot, setConnected]);
}
