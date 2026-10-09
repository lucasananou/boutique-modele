"use client";

import { useCart, selectSubtotal, selectCount } from "@/lib/store/cart";
import { formatPriceLocale } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import type { UiCopy } from "@/lib/translations";
import { ProductImage } from "@/components/ui/ProductImage";
import { useState } from "react";

export interface PromoState {
  status: "idle" | "checking" | "valid" | "invalid";
  discount: number;
  detail?: string;
}

interface SummaryProps {
  locale: Locale;
  copy: UiCopy;
  promoCode: string;
  onPromoCodeChange: (value: string) => void;
  onApplyPromo: () => void;
  promo: PromoState;
}

/** Récapitulatif collant du checkout desktop (écran 3a). */
export function OrderSummary({
  locale,
  copy,
  promoCode,
  onPromoCodeChange,
  onApplyPromo,
  promo,
}: SummaryProps) {
  const lines = useCart((s) => s.lines);
  const setQuantity = useCart((s) => s.setQuantity);
  const subtotal = useCart(selectSubtotal);
  const giftWrap = useCart((s) => s.giftWrap);
  const toggleGiftWrap = useCart((s) => s.toggleGiftWrap);
  const discount = promo.status === "valid" ? promo.discount : 0;

  return (
    <aside className="lg:sticky lg:top-28 self-start">
      <div className="bg-ivory-light p-7">
        <div className="eyebrow mb-5">{copy.checkout.summary}</div>

        <div className="grid gap-[18px]">
          {lines.map((line) => (
            <div key={line.key} className="flex gap-3.5 items-start">
              <div className="relative w-14 aspect-[3/4] shrink-0 overflow-hidden">
                <ProductImage src={line.image.src} alt={line.image.alt} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-sans text-[14px] leading-[1.4] text-ink">
                  {line.name}
                </div>
                <div className="font-sans text-[12px] leading-[1.5] text-warm-500 mt-[3px]">
                  {line.materialLabel}
                  {line.variantLabel ? ` · ${line.variantLabel}` : ""}
                </div>
                <div className="flex items-center gap-[11px] mt-[9px] font-sans text-[13px] text-warm-700">
                  <button
                    onClick={() => setQuantity(line.key, line.quantity - 1)}
                    aria-label={copy.product.decreaseQty}
                    className="w-[18px] h-[18px] border border-ink/20 flex items-center justify-center hover:border-champagne transition-colors cursor-pointer"
                  >
                    −
                  </button>
                  <span className="text-ink">{line.quantity}</span>
                  <button
                    onClick={() => setQuantity(line.key, line.quantity + 1)}
                    aria-label={copy.product.increaseQty}
                    className="w-[18px] h-[18px] border border-ink/20 flex items-center justify-center hover:border-champagne transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="font-sans text-[14px] leading-[1.4] text-ink whitespace-nowrap">
                {formatPriceLocale(line.unitPrice * line.quantity, locale)}
              </div>
            </div>
          ))}
        </div>

        <label className="flex gap-3 items-start mt-6 pt-5 border-t border-ink/12 cursor-pointer">
          <input
            type="checkbox"
            checked={giftWrap}
            onChange={(e) => toggleGiftWrap(e.target.checked)}
            className="mt-0.5 accent-champagne w-[18px] h-[18px]"
          />
          <span className="font-sans text-[13px] leading-[1.5] text-warm-700">
            {copy.checkout.gift}{" "}
            <span className="text-warm-500">— {copy.common.free.toLowerCase()}</span>
          </span>
        </label>

        <PromoField
          copy={copy}
          value={promoCode}
          onChange={onPromoCodeChange}
          onApply={onApplyPromo}
          promo={promo}
          locale={locale}
        />

        <div className="mt-[22px] pt-5 border-t border-ink/12 grid gap-[11px] font-sans text-[14px] text-warm-700">
          <div className="flex justify-between">
            <span>{copy.common.subtotal}</span>
            <span className="text-ink">{formatPriceLocale(subtotal, locale)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-champagne">
              <span>{copy.checkout.discount}</span>
              <span>−{formatPriceLocale(discount, locale)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>{copy.checkout.shipping}</span>
            <span className="text-ink">{copy.common.free}</span>
          </div>
        </div>

        <div className="mt-[18px] pt-[18px] border-t border-ink/20 flex justify-between items-baseline">
          <span className="font-serif text-[20px] text-ink">{copy.common.total}</span>
          <span className="font-serif text-[24px] text-ink">
            {formatPriceLocale(Math.max(0, subtotal - discount), locale)}
          </span>
        </div>
        <div className="font-sans text-[12px] leading-[1.6] text-warm-500 mt-1.5 text-end">
          {copy.checkout.vatIncluded}
        </div>
        <div className="font-sans text-[12px] leading-[1.6] text-champagne mt-3.5 pt-3.5 border-t border-ink/12">
          {copy.checkout.shippingNote}
        </div>
      </div>

      <div className="grid gap-3 mt-5 font-sans text-[13px] leading-[1.6] text-warm-700">
        {copy.checkout.guarantees.map((line) => (
          <div key={line} className="flex gap-2.5">
            <span aria-hidden className="text-champagne">
              —
            </span>
            {line}
          </div>
        ))}
      </div>
    </aside>
  );
}

function PromoField({
  copy,
  value,
  onChange,
  onApply,
  promo,
  locale,
}: {
  copy: UiCopy;
  value: string;
  onChange: (v: string) => void;
  onApply: () => void;
  promo: PromoState;
  locale: Locale;
}) {
  return (
    <div className="mt-6 pt-5 border-t border-ink/12">
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onApply();
            }
          }}
          placeholder={copy.checkout.promoCode}
          aria-label={copy.checkout.promoCode}
          className="flex-1 min-w-0 font-sans text-[13px] tracking-[0.08em] text-ink bg-ivory border border-ink/20 px-3 py-[11px] outline-none focus:border-champagne uppercase placeholder:tracking-normal placeholder:normal-case"
        />
        <button
          type="button"
          onClick={onApply}
          disabled={promo.status === "checking" || !value.trim()}
          className="border border-ink px-4 py-[11px] font-sans text-[12px] tracking-[0.06em] uppercase text-ink hover:bg-ink hover:text-ivory-light transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default"
        >
          {copy.checkout.promoApply}
        </button>
      </div>
      {promo.status === "valid" && (
        <div className="font-sans text-[12px] leading-[1.6] text-champagne mt-2">
          {promo.detail ??
            copy.checkout.promoApplied.replace(
              "{amount}",
              formatPriceLocale(promo.discount, locale),
            )}
        </div>
      )}
      {promo.status === "invalid" && (
        <div className="font-sans text-[12px] leading-[1.6] text-warm-500 mt-2">
          {copy.checkout.promoInvalid}
        </div>
      )}
    </div>
  );
}

/** Bandeau récapitulatif dépliable en tête du checkout mobile (écran 3b). */
export function MobileSummary({
  locale,
  copy,
  discount,
}: {
  locale: Locale;
  copy: UiCopy;
  discount: number;
}) {
  const [open, setOpen] = useState(false);
  const lines = useCart((s) => s.lines);
  const subtotal = useCart(selectSubtotal);
  const count = useCart(selectCount);

  return (
    <div className="lg:hidden -mx-6 mb-8">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex justify-between items-center px-5 py-[15px] bg-ivory-light font-sans text-[14px] text-warm-700 cursor-pointer"
      >
        <span className="underline underline-offset-[3px]">
          {copy.checkout.summary} ·{" "}
          {count} {count > 1 ? copy.common.pieces : copy.common.piece}
        </span>
        <span className="font-sans text-[15px] text-ink">
          {formatPriceLocale(Math.max(0, subtotal - discount), locale)}
        </span>
      </button>
      {open && (
        <div className="bg-ivory-light px-5 pb-5 pt-1 grid gap-3.5">
          {lines.map((line) => (
            <div key={line.key} className="flex gap-3 items-center">
              <div className="relative w-11 aspect-[3/4] shrink-0 overflow-hidden">
                <ProductImage src={line.image.src} alt={line.image.alt} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-sans text-[13px] leading-[1.4] text-ink">
                  {line.name}
                </div>
                <div className="font-sans text-[11px] leading-[1.5] text-warm-500">
                  {line.variantLabel ? `${line.variantLabel} · ` : ""}×{line.quantity}
                </div>
              </div>
              <div className="font-sans text-[13px] text-ink whitespace-nowrap">
                {formatPriceLocale(line.unitPrice * line.quantity, locale)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
