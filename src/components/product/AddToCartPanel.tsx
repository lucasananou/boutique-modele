"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";
import type { ActiveFlashSale } from "@/lib/flashSale";
import { useCart } from "@/lib/store/cart";
import { variantPrice, discountPercent } from "@/lib/productUtils";
import { formatPriceLocale } from "@/lib/format";
import { localizedPath, type Locale } from "@/lib/i18n";
import { interpolate, t } from "@/lib/translations";
import { colorHexForName } from "@/lib/colorUtils";
import { trackEvent, gaItem } from "@/lib/analytics";
import { Countdown } from "@/components/ui/Countdown";
import { SizeGuideModal } from "./SizeGuideModal";
import { useProductVariantSelection } from "./ProductVariantSelection";

const LOW_STOCK = 5;

export function AddToCartPanel({
  product,
  flashSale,
  locale = "fr",
  intro,
}: {
  product: Product;
  flashSale?: ActiveFlashSale | null;
  locale?: Locale;
  /**
   * Argumentaire court, inséré entre le prix et le choix de la taille. Le prix
   * dépend de la variante sélectionnée : il ne peut pas sortir de ce composant
   * client, c'est donc la description qui vient s'y glisser.
   */
  intro?: ReactNode;
}) {
  const add = useCart((s) => s.add);
  const router = useRouter();
  const hasVariants = product.variants.length > 0;
  const firstAvailable = product.variants.find((v) => v.available);
  const hasColorOptions = product.variants.some((v) => v.colorName);
  const hasVariantStock = product.variants.some((v) => (v.stock ?? 0) > 0);
  const selection = useProductVariantSelection();
  const [variantId, setVariantId] = useState<string | undefined>(
    selection?.selectedVariantId ?? firstAvailable?.id,
  );
  const [colorName, setColorName] = useState<string | undefined>(
    firstAvailable?.colorName,
  );
  const [sizeLabel, setSizeLabel] = useState<string | undefined>(
    firstAvailable?.sizeLabel,
  );
  const [qty, setQty] = useState(1);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const copy = t(locale);

  const selectedVariant = hasColorOptions
    ? product.variants.find(
        (v) =>
          v.colorName === colorName &&
          (!v.sizeLabel || v.sizeLabel === sizeLabel),
      )
    : product.variants.find((v) => v.id === variantId);
  const selectedVariantId = selectedVariant?.id ?? variantId;
  const price = variantPrice(product, selectedVariantId);
  const off = discountPercent(product.price, product.compareAtPrice);
  const needsVariant = hasVariants && !selectedVariant;
  const effectiveStock =
    selectedVariant && hasVariantStock ? (selectedVariant.stock ?? 0) : product.stock;
  const isSelectedAvailable =
    !hasVariants ||
    Boolean(
      selectedVariant?.available &&
        (!hasVariantStock || (selectedVariant.stock ?? 0) > 0),
    );
  const canBuy = product.inStock && isSelectedAvailable;
  const lowStock = canBuy && effectiveStock > 0 && effectiveStock <= LOW_STOCK;
  const selectedLabel = selectedVariant?.label;
  const sameColorImage = selectedVariant?.colorName
    ? product.images.find((img) => {
        if (!img.variantId) return false;
        const variant = product.variants.find((v) => v.id === img.variantId);
        return variant?.colorName === selectedVariant.colorName;
      })
    : undefined;
  const selectedImage =
    (selectedVariant
      ? product.images.find((i) => i.variantId === selectedVariant.id)
      : undefined) ??
    sameColorImage ??
    product.images[0] ?? { src: "", alt: product.name };

  useEffect(() => {
    selection?.setSelectedVariantId(selectedVariantId);
  }, [selectedVariantId, selection]);

  const colorOptions = useMemo(() => {
    const seen = new Set<string>();
    return product.variants
      .filter(
        (v) => v.colorName && !seen.has(v.colorName) && seen.add(v.colorName),
      )
      .map((v) => ({
        name: v.colorName!,
        hex: colorHexForName(v.colorName!, v.colorHex),
        available: product.variants.some(
          (x) =>
            x.colorName === v.colorName &&
            x.available &&
            (!hasVariantStock || (x.stock ?? 0) > 0),
        ),
      }));
  }, [hasVariantStock, product.variants]);

  const sizeOptions = hasColorOptions
    ? product.variants.filter((v) => v.colorName === colorName && v.sizeLabel)
    : product.variants;

  // Deux colonnes seulement si les deux choix tiennent côte à côte : au-delà de
  // quatre couleurs, les pastilles se replieraient sur trop de lignes.
  const sideBySide =
    hasColorOptions &&
    colorOptions.length > 0 &&
    colorOptions.length <= 4 &&
    sizeOptions.length > 0;

  function selectColor(nextColor: string) {
    setColorName(nextColor);
    const first = product.variants.find(
      (v) =>
        v.colorName === nextColor &&
        v.available &&
        (!hasVariantStock || (v.stock ?? 0) > 0),
    );
    setSizeLabel(first?.sizeLabel);
    setVariantId(first?.id);
  }

  function selectVariant(id: string) {
    const variant = product.variants.find((v) => v.id === id);
    setVariantId(id);
    setColorName(variant?.colorName);
    setSizeLabel(variant?.sizeLabel);
  }

  function buildItem() {
    const variant = selectedVariant;
    return {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      materialLabel: product.materialLabel,
      unitPrice: price,
      image: selectedImage,
      variantId: selectedVariantId,
      variantLabel: variant?.label,
    };
  }

  function trackAdd() {
    const variant = selectedVariant;
    const item = gaItem({
      slug: product.slug,
      name: product.name,
      priceCents: price,
      category: product.category,
      variantLabel: variant?.label,
      quantity: qty,
    });
    trackEvent("add_to_cart", {
      currency: "EUR",
      value: item.price * item.quantity,
      items: [item],
    });
  }

  function handleAdd() {
    add(buildItem(), qty);
    trackAdd();
  }

  function handleBuyNow() {
    add(buildItem(), qty);
    trackAdd();
    router.push(localizedPath("/commande", locale));
  }

  return (
    <div>
      <div className="flex items-baseline gap-3 mb-1.5">
        <span className="font-serif text-[34px] text-ink leading-none">
          {formatPriceLocale(price, locale)}
        </span>
        {off > 0 && (
          <>
            <span className="font-sans text-[17px] text-warm-300 line-through">
              {formatPriceLocale(product.compareAtPrice!, locale)}
            </span>
            <span className="font-sans text-[11px] tracking-[0.12em] text-ivory-light bg-ink px-2.5 py-1">
              -{off}%
            </span>
          </>
        )}
      </div>
      <div className="font-sans text-[13px] text-warm-500 mb-6">
        {copy.product.taxNote}
      </div>

      {product.inStock && off > 0 && (
        <div className="flex items-center gap-3 bg-ivory-light border border-sand-soft px-4 py-3 mb-6">
          <span className="w-2 h-2 rounded-full bg-champagne shrink-0" />
          <span className="font-sans text-[13px] text-warm-700 leading-snug">
            {flashSale ? (
              <>
                {interpolate(copy.product.offerEnds, { off })}{" "}
                <Countdown endsAt={flashSale.endsAt} variant="inline" />.
              </>
            ) : (
              <>{interpolate(copy.product.offerActive, { off })}</>
            )}
          </span>
        </div>
      )}

      {intro && <div className="mb-7">{intro}</div>}

      {hasVariants && (
        // Couleur et taille côte à côte : deux blocs empilés coûtaient un écran
        // de défilement avant le bouton d'achat. On repasse en colonne dès que
        // les couleurs sont nombreuses, sinon elles se retrouvent à l'étroit.
        <div
          className={[
            "mb-6",
            // Colonne couleur calée sur son contenu (un 50/50 laissait un trou
            // avec un seul coloris) ; la colonne taille prend le reste pour que
            // le guide des tailles reste ancré au bord droit du panneau.
            sideBySide
              ? "grid gap-x-10 gap-y-6 sm:grid-cols-[minmax(0,auto)_minmax(190px,1fr)] items-start"
              : "",
          ].join(" ")}
        >
          {hasColorOptions && colorOptions.length > 0 && (
            <div className={sideBySide ? "" : "mb-5"}>
              <div className="flex justify-between items-baseline mb-3">
                <span className="font-sans text-[13px] tracking-[0.06em] uppercase text-warm-700">
                  {copy.product.color}{colorName ? ` - ${colorName}` : ""}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((c) => (
                  <button
                    key={c.name}
                    disabled={!c.available}
                    onClick={() => selectColor(c.name)}
                    aria-pressed={c.name === colorName}
                    className={[
                      "font-sans text-[13px] h-[46px] px-3 rounded-sm border transition-colors inline-flex items-center gap-2",
                      c.name === colorName
                        ? "border-ink bg-ink text-ivory-light"
                        : c.available
                          ? "border-sand-soft text-ink hover:border-ink"
                          : "border-sand-soft/60 text-warm-300 line-through cursor-not-allowed opacity-70",
                    ].join(" ")}
                  >
                    <span
                      aria-hidden
                      className="w-3.5 h-3.5 rounded-full border border-ink/10"
                      style={{ background: c.hex }}
                    />
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {sizeOptions.length > 0 && (
            <div>
              <div className="flex justify-between items-baseline mb-3 gap-3">
                <span className="font-sans text-[13px] tracking-[0.06em] uppercase text-warm-700">
                  {copy.product.size}{selectedLabel && !hasColorOptions ? ` - ${selectedLabel}` : ""}
                </span>
                <button
                  type="button"
                  onClick={() => setSizeGuideOpen(true)}
                  className="font-sans text-[12px] text-champagne border-b border-champagne/40 hover:border-champagne transition-colors cursor-pointer shrink-0"
                >
                  {copy.nav.sizeGuide}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {sizeOptions.map((v) => {
                  const available =
                    v.available && (!hasVariantStock || (v.stock ?? 0) > 0);
                  return (
                    <button
                      key={v.id}
                      disabled={!available}
                      onClick={() => selectVariant(v.id)}
                      aria-pressed={v.id === selectedVariantId}
                      className={[
                        "font-sans text-[14px] min-w-[50px] h-[46px] px-2 rounded-sm border transition-colors",
                        v.id === selectedVariantId
                          ? "border-ink bg-ink text-ivory-light"
                          : available
                            ? "border-sand-soft text-ink hover:border-ink"
                            : "border-sand-soft/60 text-warm-300 line-through cursor-not-allowed opacity-70",
                      ].join(" ")}
                    >
                      {hasColorOptions ? (v.sizeLabel ?? v.label) : v.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {canBuy && lowStock && (
        <div className="flex items-center gap-2 mb-6 font-sans text-[13px] text-warm-700">
          <span className="w-1.5 h-1.5 rounded-full bg-champagne shrink-0" />
          {interpolate(copy.product.lowStock, { count: effectiveStock })}
        </div>
      )}

      {canBuy ? (
        <>
          <div className="flex gap-3 mb-4">
            <div className="flex items-center border border-ink">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label={copy.product.decreaseQty}
                className="w-11 h-[54px] flex items-center justify-center text-[18px] cursor-pointer"
              >
                -
              </button>
              <span
                className="w-10 text-center font-sans text-[15px]"
                aria-live="polite"
              >
                {qty}
              </span>
              <button
                onClick={() => setQty((q) => Math.min(9, q + 1))}
                aria-label={copy.product.increaseQty}
                className="w-11 h-[54px] flex items-center justify-center text-[18px] cursor-pointer"
              >
                +
              </button>
            </div>
            <button
              onClick={handleAdd}
              disabled={needsVariant}
              className="flex-1 font-sans text-[13px] tracking-[0.12em] uppercase text-ivory-light bg-ink h-[54px] hover:bg-champagne transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {needsVariant
                ? copy.product.chooseVariant
                : `${copy.product.addToCart} - ${formatPriceLocale(price, locale)}`}
            </button>
          </div>
          <button
            onClick={handleBuyNow}
            disabled={needsVariant}
            className="w-full font-sans text-[13px] tracking-[0.12em] uppercase text-ink bg-white border border-ink h-[52px] hover:bg-ivory-light transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mb-7"
          >
            {copy.product.buyNow}
          </button>
        </>
      ) : (
        <div className="mb-7">
          <button
            disabled
            className="w-full font-sans text-[13px] tracking-[0.12em] uppercase text-warm-500 bg-mineral h-[54px] cursor-not-allowed"
          >
            {copy.product.soldOut}
          </button>
        </div>
      )}

      <div className="border-t border-sand-soft pt-5 flex flex-col gap-3">
        {[
          [copy.product.returnLabel, copy.product.returnText],
          [copy.product.shippingLabel, copy.product.shippingText],
          [copy.product.paymentLabel, copy.product.paymentText],
        ].map(([icon, text]) => (
          <div key={text} className="flex gap-3 items-start">
            <span
              aria-hidden="true"
              className="font-sans text-[13px] text-champagne w-[62px] shrink-0"
            >
              {icon}
            </span>
            <span className="font-sans text-[13.5px] text-warm-700 leading-[1.5]">
              {text}
            </span>
          </div>
        ))}
      </div>

      {sizeGuideOpen && (
        <SizeGuideModal onClose={() => setSizeGuideOpen(false)} locale={locale} />
      )}

      {canBuy && (
        <div
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center gap-3 bg-ivory/95 backdrop-blur border-t border-sand-soft px-4 py-3"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <div className="flex flex-col leading-none">
            <span className="font-serif text-[18px] text-ink">
              {formatPriceLocale(price, locale)}
            </span>
            {off > 0 && (
              <span className="font-sans text-[11px] text-warm-300 line-through mt-0.5">
                {formatPriceLocale(product.compareAtPrice!, locale)}
              </span>
            )}
          </div>
          <button
            onClick={handleAdd}
            disabled={needsVariant}
            className="flex-1 font-sans text-[13px] tracking-[0.1em] uppercase text-ivory-light bg-ink h-[48px] rounded-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {needsVariant ? copy.product.chooseVariantShort : copy.product.addToCart}
          </button>
        </div>
      )}
    </div>
  );
}
