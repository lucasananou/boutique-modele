"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import { formatPriceLocale } from "@/lib/format";
import { localizedPath, type Locale } from "@/lib/i18n";
import { interpolate, t } from "@/lib/translations";
import { discountPercent } from "@/lib/productUtils";
import { colorHexForName, isLightColor } from "@/lib/colorUtils";
import { ProductImage } from "@/components/ui/ProductImage";
import { FavoriteButton } from "./FavoriteButton";
import { QuickAddButton } from "./QuickAddButton";

export function ProductCard({ product, locale = "fr" }: { product: Product; locale?: Locale }) {
  const off = discountPercent(product.price, product.compareAtPrice);
  const colorOptions = useMemo(() => getColorOptions(product), [product]);
  const copy = t(locale);
  const [selectedColor, setSelectedColor] = useState<string | undefined>(() =>
    getInitialColor(product),
  );
  const activeImage =
    getImageForColor(product, selectedColor) ??
    product.images[0] ?? { src: "", alt: product.name };

  return (
    <div className="flex flex-col group">
      <div className="relative bg-sand rounded-sm overflow-hidden">
        {off > 0 ? (
          <span className="absolute top-3 left-3 z-[3] font-sans text-[11px] tracking-[0.14em] text-ivory-light bg-ink px-2.5 py-[5px]">
            −{off}%
          </span>
        ) : (
          product.badge && (
            <span className="absolute top-3 left-3 z-[3] font-sans text-[10px] tracking-[0.14em] uppercase text-ink bg-ivory-light/92 px-2.5 py-[5px] rounded-xs">
              {translateBadge(product.badge, locale)}
            </span>
          )
        )}
        <FavoriteButton productId={product.id} floating />
        <Link href={localizedPath(`/produit/${product.slug}`, locale)} className="block">
          <div className="relative aspect-[2/3] overflow-hidden">
            <ProductImage
              src={activeImage.src}
              alt={activeImage.alt}
              className="transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          </div>
        </Link>
      </div>
      <div className="pt-[14px]">
        <Link
          href={localizedPath(`/produit/${product.slug}`, locale)}
          className="font-serif text-[20px] leading-[1.2] text-ink mb-2 block hover:text-champagne transition-colors"
        >
          {product.name}
        </Link>
        {colorOptions.length > 0 && (
          <div
            className="flex flex-wrap items-center gap-2 mb-2.5"
            aria-label={interpolate(copy.catalog.colorsFor, { name: product.name })}
          >
            {colorOptions.map((color) => {
              const active = color.name === selectedColor;
              return (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => setSelectedColor(color.name)}
                  className="relative h-[18px] w-[18px] rounded-full cursor-pointer transition-transform hover:scale-110"
                  style={{
                    background: color.hex,
                    border: active
                      ? "2px solid #14151A"
                      : "1px solid rgba(20,21,26,0.18)",
                    boxShadow: active
                      ? "0 0 0 2px #FBFAF8, 0 0 0 3px #14151A"
                      : "0 0 0 2px #FBFAF8",
                  }}
                  title={color.name}
                  aria-label={interpolate(copy.catalog.viewColor, { color: color.name })}
                  aria-pressed={active}
                >
                  {color.isLight && (
                    <span
                      aria-hidden
                      className="absolute inset-[5px] rounded-full"
                      style={{ border: "1px solid rgba(20,21,26,0.08)" }}
                    />
                  )}
                </button>
              );
            })}
            <span className="font-sans text-[11px] text-warm-500 ml-1">
              {interpolate(copy.catalog.colorsAvailable, {
                count: colorOptions.length,
                plural: locale === "fr" && colorOptions.length > 1 ? "s" : locale === "en" && colorOptions.length !== 1 ? "s" : "",
              })}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2.5">
            <span className="font-sans text-[15px] text-champagne">
              {formatPriceLocale(product.price, locale)}
            </span>
            {off > 0 && (
              <span className="font-sans text-[13px] text-warm-300 line-through">
                {formatPriceLocale(product.compareAtPrice!, locale)}
              </span>
            )}
          </div>
          <QuickAddButton product={product} locale={locale} />
        </div>
      </div>
    </div>
  );
}

function getColorOptions(product: Product) {
  const seen = new Set<string>();
  return product.variants
    .filter((variant) => variant.colorName)
    .filter((variant) => {
      const name = variant.colorName!;
      if (seen.has(name)) return false;
      seen.add(name);
      return true;
    })
    .map((variant) => {
      const hex = colorHexForName(variant.colorName!, variant.colorHex);
      return {
        name: variant.colorName!,
        hex,
        isLight: isLightColor(hex),
      };
    });
}

function getInitialColor(product: Product) {
  const firstImageVariantId = product.images[0]?.variantId;
  if (!firstImageVariantId) return undefined;
  return product.variants.find((variant) => variant.id === firstImageVariantId)
    ?.colorName;
}

function getImageForColor(product: Product, colorName?: string) {
  if (!colorName) return undefined;
  return product.images.find((image) => {
    if (!image.variantId) return false;
    const variant = product.variants.find((v) => v.id === image.variantId);
    return variant?.colorName === colorName;
  });
}

function translateBadge(badge: string, locale: Locale) {
  const normalized = badge
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
  if (normalized.includes("nouveaute")) return t(locale).product.newBadge;
  return badge;
}
