"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import { ProductImage } from "@/components/ui/ProductImage";
import { FavoriteButton } from "./FavoriteButton";
import { useProductVariantSelection } from "./ProductVariantSelection";

export function ProductGallery({ product }: { product: Product }) {
  const images = product.images.length
    ? product.images
    : [{ src: "", alt: product.name }];
  const selection = useProductVariantSelection();
  const selectedVariant = product.variants.find(
    (v) => v.id === selection?.selectedVariantId,
  );

  const exact = selection?.selectedVariantId
    ? images.findIndex((img) => img.variantId === selection.selectedVariantId)
    : -1;
  const sameColor =
    exact < 0 && selectedVariant?.colorName
      ? images.findIndex((img) => {
          if (!img.variantId) return false;
          const variant = product.variants.find((v) => v.id === img.variantId);
          return variant?.colorName === selectedVariant.colorName;
        })
      : -1;
  const initialActive = exact >= 0 ? exact : sameColor >= 0 ? sameColor : 0;

  return (
    <ProductGalleryView
      key={selection?.selectedVariantId ?? "default"}
      product={product}
      images={images}
      initialActive={initialActive}
    />
  );
}

function ProductGalleryView({
  product,
  images,
  initialActive,
}: {
  product: Product;
  images: { src: string; alt: string; variantId?: string }[];
  initialActive: number;
}) {
  const [active, setActive] = useState(initialActive);

  return (
    <div className="flex min-w-0 max-w-full flex-col-reverse gap-4 md:flex-row">
      {images.length > 1 && (
        <div className="flex w-full min-w-0 max-w-full gap-3 overflow-x-auto pb-1 md:w-auto md:flex-col md:overflow-visible md:pb-0">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={[
                "relative w-[64px] h-[72px] rounded-xs overflow-hidden shrink-0 transition-opacity",
                i === active
                  ? "ring-1 ring-champagne"
                  : "opacity-70 hover:opacity-100",
              ].join(" ")}
              aria-label={`Vue ${i + 1}`}
            >
              <ProductImage src={img.src} alt={img.alt} sizes="64px" />
            </button>
          ))}
        </div>
      )}
      <div className="relative min-w-0 w-full flex-1 aspect-[4/5] rounded-sm overflow-hidden bg-ivory">
        {product.badge && (
          <span className="absolute top-4 left-4 z-[3] font-sans text-[10px] tracking-[0.14em] uppercase text-ink bg-ivory-light/92 px-3 py-1.5 rounded-xs">
            {product.badge}
          </span>
        )}
        <FavoriteButton productId={product.id} floating />
        <ProductImage
          src={images[active].src}
          alt={images[active].alt}
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
    </div>
  );
}
