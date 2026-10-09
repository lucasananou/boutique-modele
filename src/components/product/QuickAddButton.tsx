"use client";

import Link from "next/link";
import { useCart } from "@/lib/store/cart";
import { trackEvent, gaItem } from "@/lib/analytics";
import type { Product } from "@/lib/types";
import { localizedPath, type Locale } from "@/lib/i18n";
import { t } from "@/lib/translations";

/**
 * Ajout rapide depuis une grille. Si la pièce a des variantes (tailles), on
 * NE peut pas ajouter sans taille → on renvoie vers la fiche pour choisir.
 * Les pièces sans variante sont ajoutées directement.
 */
export function QuickAddButton({ product, locale = "fr" }: { product: Product; locale?: Locale }) {
  const add = useCart((s) => s.add);
  const copy = t(locale).product;

  if (!product.inStock) {
    return (
      <span className="font-sans text-[11px] tracking-[0.1em] uppercase text-warm-500">
        {copy.soldOut}
      </span>
    );
  }

  // Article à tailles : on dirige vers la fiche (choix de taille obligatoire).
  if (product.variants.length > 0) {
    return (
      <Link
        href={localizedPath(`/produit/${product.slug}`, locale)}
        className="font-sans text-[11px] tracking-[0.1em] uppercase text-ink border-b border-champagne pb-[3px] hover:text-champagne transition-colors"
      >
        {copy.choose}
      </Link>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        add({
          productId: product.id,
          slug: product.slug,
          name: product.name,
          materialLabel: product.materialLabel,
          unitPrice: product.price,
          image: product.images[0] ?? { src: "", alt: product.name },
        });
        const item = gaItem({
          slug: product.slug,
          name: product.name,
          priceCents: product.price,
          category: product.category,
        });
        trackEvent("add_to_cart", {
          currency: "EUR",
          value: item.price,
          items: [item],
        });
      }}
      className="font-sans text-[11px] tracking-[0.1em] uppercase text-ink border-b border-champagne pb-[3px] hover:text-champagne transition-colors cursor-pointer"
    >
      {copy.add}
    </button>
  );
}
