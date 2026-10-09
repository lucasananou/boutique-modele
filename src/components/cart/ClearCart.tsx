"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/store/cart";

/** Vide le panier au montage (après une commande confirmée). */
export function ClearCart() {
  const clear = useCart((s) => s.clear);
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}
