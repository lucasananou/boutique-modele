"use client";

import Link from "next/link";
import { useCart, selectSubtotal } from "@/lib/store/cart";
import { useHasMounted } from "@/lib/useHasMounted";
import { formatPriceLocale } from "@/lib/format";
import { usePathname } from "next/navigation";
import { localeFromPathname, localizedPath, type Locale } from "@/lib/i18n";
import { t } from "@/lib/translations";
import { ProductImage } from "@/components/ui/ProductImage";
import { CloseIcon } from "@/components/ui/icons";
import { LeadCaptureForm } from "./LeadCaptureForm";
import { hasCaptured } from "@/lib/leadCapture";

export function CartDrawer() {
  const mounted = useHasMounted();
  const isOpen = useCart((s) => s.isOpen);
  const close = useCart((s) => s.close);
  const lines = useCart((s) => s.lines);
  const remove = useCart((s) => s.remove);
  const setQuantity = useCart((s) => s.setQuantity);
  const giftWrap = useCart((s) => s.giftWrap);
  const toggleGiftWrap = useCart((s) => s.toggleGiftWrap);
  const subtotal = useCart(selectSubtotal);

  const open = mounted && isOpen;
  const hasLines = lines.length > 0;
  const captured = mounted && hasCaptured();
  const locale: Locale = localeFromPathname(usePathname());
  const copy = t(locale);

  return (
    <>
      {/* Voile */}
      <div
        onClick={close}
        className={[
          "fixed inset-0 z-50 bg-ink/40 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0 pointer-events-none",
        ].join(" ")}
        aria-hidden
      />

      {/* Panneau */}
      <aside
        className={[
          "fixed top-0 right-0 bottom-0 z-50 w-full max-w-[420px] bg-ivory-light flex flex-col",
          "transition-transform duration-500",
          // Ombre seulement à l'ouverture : panneau fermé, elle débordait en
          // bande grisée sur le bord droit de toutes les pages.
          open ? "translate-x-0 shadow-[-30px_0_60px_-30px_rgba(28,23,18,0.4)]" : "translate-x-full",
        ].join(" ")}
        style={{ transitionTimingFunction: "var(--ease-lux)" }}
        role="dialog"
        aria-label={copy.cart.title}
        aria-hidden={!open}
      >
        <div className="flex justify-between items-center px-7 py-6 border-b border-ink/10">
          <span className="font-serif text-[20px] text-ink">{copy.cart.title}</span>
          <button
            onClick={close}
            aria-label={copy.nav.close}
            className="text-ink hover:text-champagne transition-colors flex cursor-pointer"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-7">
          {!hasLines ? (
            <div className="py-16 text-center">
              <p className="font-sans text-[14px] text-warm-500 leading-[1.7]">
                {copy.cart.empty}
                <br />
                {copy.cart.emptyHelp}
              </p>
              <Link
                href={localizedPath("/boutique", locale)}
                onClick={close}
                className="inline-block mt-6 font-sans text-[12px] uppercase tracking-[0.08em] text-ink border-b border-champagne pb-1 hover:text-champagne transition-colors"
              >
                {copy.cart.discoverShop}
              </Link>
            </div>
          ) : (
            <>
              {lines.map((line) => (
                <div
                  key={line.key}
                  className="flex gap-4 py-5 border-b border-ink/8"
                >
                  <div className="relative w-[72px] h-[80px] rounded-xs overflow-hidden shrink-0">
                    <ProductImage src={line.image.src} alt={line.image.alt} />
                  </div>
                  <div className="flex-1">
                    <Link
                      href={localizedPath(`/produit/${line.slug}`, locale)}
                      onClick={close}
                      className="font-serif text-[16px] text-ink hover:text-champagne transition-colors"
                    >
                      {line.name}
                    </Link>
                    <div className="font-sans text-[12px] text-warm-500 mt-0.5 mb-2.5">
                      {line.materialLabel}
                      {line.variantLabel ? ` · ${line.variantLabel}` : ""}
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center border border-ink/15 rounded-xs">
                        <button
                          onClick={() => setQuantity(line.key, line.quantity - 1)}
                          className="px-2 py-1 text-warm-500 hover:text-ink cursor-pointer"
                          aria-label={copy.product.decreaseQty}
                        >
                          −
                        </button>
                        <span className="font-sans text-[13px] w-6 text-center">
                          {line.quantity}
                        </span>
                        <button
                          onClick={() => setQuantity(line.key, line.quantity + 1)}
                          className="px-2 py-1 text-warm-500 hover:text-ink cursor-pointer"
                          aria-label={copy.product.increaseQty}
                        >
                          +
                        </button>
                      </div>
                      <span className="font-sans text-[13.5px] text-ink">
                        {formatPriceLocale(line.unitPrice * line.quantity, locale)}
                      </span>
                    </div>
                    <button
                      onClick={() => remove(line.key)}
                      className="font-sans text-[11px] text-warm-500 underline hover:text-champagne transition-colors mt-2 cursor-pointer"
                    >
                      {copy.common.remove}
                    </button>
                  </div>
                </div>
              ))}

              <label className="flex gap-3 items-start py-5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={giftWrap}
                  onChange={(e) => toggleGiftWrap(e.target.checked)}
                  className="mt-0.5 accent-champagne w-[18px] h-[18px]"
                />
                <span className="font-sans text-[13px] text-warm-700 leading-[1.5]">
                  {copy.cart.gift}{" "}
                  <span className="text-warm-500">— {copy.common.free.toLowerCase()}</span>
                </span>
              </label>

              {!captured && (
                <div className="mb-6 mt-1 px-4 py-4 rounded-sm border border-champagne/25 bg-champagne/[0.06]">
                  <div className="font-sans text-[10.5px] tracking-[0.18em] uppercase text-champagne mb-1.5">
                    {copy.cart.offeredDiscount}
                  </div>
                  <div className="font-serif text-[15px] text-ink mb-3 leading-[1.35]">
                    {copy.cart.saveCart}
                  </div>
                    <LeadCaptureForm locale={locale} />
                </div>
              )}
            </>
          )}
        </div>

        {hasLines && (
          <div className="px-7 py-6 border-t border-ink/10">
            <div className="flex justify-between mb-1.5">
              <span className="font-sans text-[14px] text-warm-700">{copy.common.subtotal}</span>
              <span className="font-sans text-[16px] text-ink">
                {formatPriceLocale(subtotal, locale)}
              </span>
            </div>
            <div className="font-sans text-[12px] text-warm-500 mb-4">
              {copy.cart.shippingReturns}
            </div>
            <Link
              href={localizedPath("/commande", locale)}
              onClick={close}
              className="block w-full text-center font-sans text-[13px] tracking-[0.08em] uppercase text-ivory-light bg-ink py-4 rounded-xs hover:bg-champagne transition-colors"
            >
              {copy.cart.checkout}
            </Link>
            <button
              onClick={close}
              className="block w-full font-sans text-[12.5px] text-warm-700 pt-3.5 hover:text-champagne transition-colors cursor-pointer"
            >
              {copy.cart.continueShopping}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
