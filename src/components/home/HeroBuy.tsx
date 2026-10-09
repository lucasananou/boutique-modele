"use client";

import { useState } from "react";
import { useCart } from "@/lib/store/cart";
import { trackEvent, gaItem } from "@/lib/analytics";
import { variantPrice } from "@/lib/productUtils";
import type { Product } from "@/lib/types";

/**
 * Sélecteur de taille + ajout au panier, directement dans le hero.
 *
 * Les tailles viennent des variantes en base : une taille épuisée est barrée
 * et non cliquable. Une page d'accueil qui proposerait une taille indisponible
 * coûterait plus cher en confiance qu'elle ne rapporterait en clics.
 */
export function HeroBuy({ product }: { product: Product }) {
  const add = useCart((s) => s.add);
  const sizes = product.variants;
  const firstAvailable = sizes.find((v) => v.available && (v.stock ?? 1) > 0);
  const [selected, setSelected] = useState<string | undefined>(firstAvailable?.id);
  const [added, setAdded] = useState(false);

  const variant = sizes.find((v) => v.id === selected);
  const canBuy = product.inStock && (sizes.length === 0 || Boolean(variant));

  function addToCart() {
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      materialLabel: product.materialLabel,
      unitPrice: variantPrice(product, variant?.id),
      image: {
        src: product.images[0]?.src ?? "",
        alt: product.images[0]?.alt ?? product.name,
      },
      variantId: variant?.id,
      variantLabel: variant?.label,
    });
    setAdded(true);
    trackEvent("add_to_cart", {
      currency: "EUR",
      value: variantPrice(product, variant?.id) / 100,
      items: [
        gaItem({
          slug: product.slug,
          name: product.name,
          priceCents: variantPrice(product, variant?.id),
          variantLabel: variant?.label,
        }),
      ],
    });
  }

  return (
    <div>
      {/* Un seul choix possible : on le pre-selectionne sans afficher
          un selecteur a une case, qui donnerait une decision fictive. */}
      {sizes.length > 1 && (
        <div className="flex flex-wrap gap-2.5 mb-6">
          {sizes.map((v) => {
            const dispo = v.available && (v.stock ?? 1) > 0;
            const actif = v.id === selected;
            return (
              <button
                key={v.id}
                type="button"
                disabled={!dispo}
                onClick={() => setSelected(v.id)}
                aria-pressed={actif}
                className={[
                  "min-w-[58px] px-3 py-2.5 font-sans text-[14px] border transition-colors",
                  !dispo
                    ? "border-ink/10 text-warm-400 line-through cursor-not-allowed"
                    : actif
                      ? "border-ink text-ink"
                      : "border-ink/15 text-warm-700 hover:border-ink cursor-pointer",
                ].join(" ")}
              >
                {v.label}
              </button>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={addToCart}
        disabled={!canBuy}
        className="w-full bg-ink text-ivory-light py-[18px] font-sans text-[13px] tracking-[0.12em] uppercase hover:bg-champagne transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default"
      >
        {!product.inStock ? "Épuisé" : added ? "Ajouté au panier" : "Ajouter au panier"}
      </button>
    </div>
  );
}
