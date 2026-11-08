"use client";

import { useEffect } from "react";
import { clearCart } from "./cart";

/* Commande validée : le panier est vidé une seule fois. */
export default function ClearCart({ reference }: { reference: string }) {
  useEffect(() => {
    const key = `aoyuki:done:${reference}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    clearCart();
  }, [reference]);
  return null;
}
