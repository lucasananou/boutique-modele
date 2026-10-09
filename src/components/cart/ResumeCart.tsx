"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCart, type AddToCartInput } from "@/lib/store/cart";

export interface ResumeLine extends AddToCartInput {
  quantity: number;
}

/**
 * Ré-hydrate le panier depuis une commande abandonnée puis redirige vers
 * /commande. Vide d'abord le panier courant pour repartir exactement sur la
 * sélection d'origine. Un `promo` éventuel est passé en query pour que la page
 * commande puisse le pré-remplir (ou au moins l'afficher).
 */
export function ResumeCart({
  lines,
  promo,
}: {
  lines: ResumeLine[];
  promo?: string;
}) {
  const router = useRouter();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    const { clear, add } = useCart.getState();
    clear();
    for (const line of lines) {
      const { quantity, ...item } = line;
      add(item, quantity);
    }
    // Le drawer s'ouvre à chaque `add` — on le referme avant de naviguer.
    useCart.getState().close();

    const target = promo
      ? `/commande?promo=${encodeURIComponent(promo)}`
      : "/commande";
    router.replace(target);
  }, [lines, promo, router]);

  return null;
}
