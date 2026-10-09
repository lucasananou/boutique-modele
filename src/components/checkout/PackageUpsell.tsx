"use client";

import { useState } from "react";
import { useCart } from "@/lib/store/cart";
import { formatPriceLocale } from "@/lib/format";
import { localizedPath, type Locale } from "@/lib/i18n";
import type { UiCopy } from "@/lib/translations";
import { ProductImage } from "@/components/ui/ProductImage";
import { useRouter } from "next/navigation";

export interface UpsellItem {
  productId: string;
  slug: string;
  name: string;
  materialLabel: string;
  price: number;
  image: { src: string; alt: string };
}

/**
 * « Ajoutez au même colis » — bandeau post-achat.
 *
 * Version simple : le clic remplit le panier et renvoie au tunnel. Le
 * regroupement des deux commandes dans un seul colis se fait à la préparation.
 * Un vrai ajout à la commande déjà payée demanderait un second encaissement
 * rattaché (carte enregistrée + paiement off-session).
 */
export function PackageUpsell({
  items,
  locale,
  copy,
}: {
  items: UpsellItem[];
  locale: Locale;
  copy: UiCopy;
}) {
  const add = useCart((s) => s.add);
  const close = useCart((s) => s.close);
  const router = useRouter();
  const [added, setAdded] = useState<string[]>([]);

  if (items.length === 0) return null;

  function addToParcel(item: UpsellItem) {
    add(
      {
        productId: item.productId,
        slug: item.slug,
        name: item.name,
        materialLabel: item.materialLabel,
        unitPrice: item.price,
        image: item.image,
      },
      1,
    );
    close();
    setAdded((list) => [...list, item.slug]);
    router.push(localizedPath("/commande", locale));
  }

  return (
    <div className="bg-ink text-ivory-light px-6 md:px-11 py-13 mt-14">
      <div className="max-w-[1000px] mx-auto">
        <h2 className="font-serif font-normal text-[28px] md:text-[32px] leading-[1.2] text-ivory-light mb-2">
          {copy.confirmation.upsellTitle}
        </h2>
        <p className="font-sans text-[14px] leading-[1.7] text-ivory-light/60 mb-[34px]">
          {copy.confirmation.upsellBody}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-[26px]">
          {items.map((item) => (
            <div key={item.slug} className="flex flex-col">
              <div className="relative aspect-[4/5] overflow-hidden">
                <ProductImage src={item.image.src} alt={item.image.alt} />
              </div>
              <div className="font-sans text-[16px] leading-[1.4] mt-3.5">{item.name}</div>
              <div className="font-sans text-[13px] leading-[1.5] text-ivory-light/55 mt-1">
                {item.materialLabel}
              </div>
              {/* `mt-auto` : les prix et boutons restent alignés d'une carte à
                  l'autre même quand une description tient sur deux lignes. */}
              <div className="flex justify-between items-center mt-auto pt-3.5">
                <span className="font-sans text-[16px]">
                  {formatPriceLocale(item.price, locale)}
                </span>
                <button
                  type="button"
                  onClick={() => addToParcel(item)}
                  className="border border-ivory-light/40 px-[18px] py-2.5 font-sans text-[11px] tracking-[0.1em] uppercase hover:bg-champagne hover:border-champagne transition-colors cursor-pointer"
                >
                  {added.includes(item.slug)
                    ? copy.confirmation.upsellAdded
                    : copy.confirmation.upsellCta}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
