"use client";

import { useEffect } from "react";
import { clearBag } from "./cart";
import { trackPixel } from "./Pixels";

/* Commande payée : le sac est vidé (une seule fois par commande). */
export default function ClearBag({ reference, value }: { reference: string; value: number }) {
  useEffect(() => {
    const key = `firstdraw:done:${reference}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    clearBag();
    trackPixel("Purchase", { value, currency: "USD" });
  }, [reference, value]);
  return null;
}
