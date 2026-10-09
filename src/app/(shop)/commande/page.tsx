"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCart, selectSubtotal } from "@/lib/store/cart";
import { useHasMounted } from "@/lib/useHasMounted";
import { formatPriceLocale } from "@/lib/format";
import { localeFromPathname, localizedPath, type Locale } from "@/lib/i18n";
import { t } from "@/lib/translations";
import { currencyFor } from "@/lib/currency";
import { trackEvent, gaItem } from "@/lib/analytics";
import { trackEvent as liveTrack } from "@/lib/live/client";
import {
  OrderSummary,
  MobileSummary,
  type PromoState,
} from "@/components/checkout/OrderSummary";
import {
  useStripePayment,
  type PreparedPayment,
} from "@/components/checkout/useStripePayment";

export default function CommandePage() {
  // `useSearchParams` (lecture de ?promo=) exige une frontière Suspense.
  return (
    <Suspense fallback={<div className="min-h-[50vh]" />}>
      <CommandeContent />
    </Suspense>
  );
}

function CommandeContent() {
  const mounted = useHasMounted();
  const lines = useCart((s) => s.lines);
  const subtotal = useCart(selectSubtotal);
  const giftWrap = useCart((s) => s.giftWrap);
  const locale: Locale = localeFromPathname(usePathname());
  const copy = t(locale);

  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    line1: "",
    zip: "",
    city: "",
    country: "France",
    phone: "",
  });

  // Pré-remplit le code promo depuis `?promo=` (relance panier abandonné).
  const initialPromo = (useSearchParams().get("promo") ?? "").toUpperCase();
  const [promoCode, setPromoCode] = useState(initialPromo);
  const [promo, setPromo] = useState<PromoState>({ status: "idle", discount: 0 });

  const discount = promo.status === "valid" ? promo.discount : 0;
  const total = Math.max(0, subtotal - discount);

  const { mountRef, ready, submitting, error, setError, pay, available } =
    useStripePayment({
      amount: total,
      locale,
      genericError: copy.checkout.genericError,
      enabled: mounted && lines.length > 0,
    });

  // Commande PENDING éventuellement ouverte par une tentative précédente :
  // un paiement refusé puis réessayé ne doit pas créer un second exemplaire.
  const orderId = useRef<string | null>(null);

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  /* ---- Code promo vérifié serveur, pour afficher la remise en direct ---- */
  const checkPromo = useCallback(async () => {
    const code = promoCode.trim();
    if (!code) {
      setPromo({ status: "idle", discount: 0 });
      return;
    }
    setPromo((p) => ({ ...p, status: "checking" }));
    try {
      const res = await fetch("/api/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          locale,
          lines: lines.map((l) => ({
            productId: l.productId,
            slug: l.slug,
            variantId: l.variantId,
            quantity: l.quantity,
          })),
        }),
      });
      const data = await res.json();
      setPromo(
        data.valid
          ? { status: "valid", discount: data.discount, detail: data.detail }
          : { status: "invalid", discount: 0 },
      );
    } catch {
      setPromo({ status: "invalid", discount: 0 });
    }
  }, [promoCode, lines, locale]);

  /* ---- Entrée dans le tunnel (une seule fois) ---- */
  const tracked = useRef(false);
  useEffect(() => {
    if (!mounted || tracked.current || lines.length === 0) return;
    tracked.current = true;
    liveTrack("BEGIN_CHECKOUT", { cartValue: total });
    trackEvent("begin_checkout", {
      currency: currencyFor(locale),
      value: Math.round(total) / 100,
      items: lines.map((l) =>
        gaItem({
          slug: l.slug,
          name: l.name,
          priceCents: l.unitPrice,
          quantity: l.quantity,
          variantLabel: l.variantLabel,
        }),
      ),
    });
  }, [mounted, lines, total, locale]);

  /**
   * Appelé une fois la saisie carte validée : crée la commande et l'intent.
   * Renvoie `null` si le serveur refuse — l'erreur est déjà affichée.
   */
  async function prepare(): Promise<PreparedPayment | null> {
    try {
      const res = await fetch("/api/checkout/payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          locale,
          giftWrap,
          promoCode: promo.status === "valid" ? promoCode.trim() : undefined,
          orderId: orderId.current ?? undefined,
          shipping: {
            fullName: `${form.firstName} ${form.lastName}`.trim(),
            line1: form.line1,
            zip: form.zip,
            city: form.city,
            country: form.country,
            phone: form.phone,
          },
          lines: lines.map((l) => ({
            productId: l.productId,
            slug: l.slug,
            variantId: l.variantId,
            variantLabel: l.variantLabel,
            engraving: l.engraving,
            quantity: l.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? copy.checkout.genericError);
        return null;
      }
      orderId.current = data.orderId;
      // Sans clés Stripe (mode démonstration), la commande est déjà validée.
      if (data.demo) {
        window.location.assign(data.redirectUrl);
        return null;
      }
      return { clientSecret: data.clientSecret, returnUrl: data.returnUrl };
    } catch {
      setError(copy.checkout.networkError);
      return null;
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    pay(prepare);
  }

  if (!mounted) {
    return <div className="min-h-[50vh]" />;
  }

  if (lines.length === 0) {
    return (
      <div className="px-6 md:px-16 py-24 text-center min-h-[50vh]">
        <h1 className="font-serif text-[32px] text-ink mb-4">
          {copy.checkout.emptyTitle}
        </h1>
        <p className="font-sans text-[15px] text-warm-500 mb-8">
          {copy.checkout.emptyBody}
        </p>
        <Link
          href={localizedPath("/boutique", locale)}
          className="font-sans text-[13px] uppercase tracking-[0.08em] text-ink border-b border-champagne pb-1 hover:text-champagne transition-colors"
        >
          {copy.cart.discoverShop}
        </Link>
      </div>
    );
  }

  return (
    <div className="px-6 md:px-16 py-10 md:py-14">
      <div className="max-w-[1180px] mx-auto">
        <div className="pb-6 border-b border-ink/8">
          <Link
            href={localizedPath("/boutique", locale)}
            className="font-sans text-[13px] text-warm-500 hover:text-champagne transition-colors"
          >
            {copy.checkout.backToShop}
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-12 lg:gap-[72px] pt-10 md:pt-13">
          <div className="min-w-0">
            <h1 className="font-serif font-normal text-[34px] md:text-[40px] leading-[1.15] text-ink mb-2.5">
              {copy.checkout.title}
            </h1>
            <p className="font-sans text-[14px] leading-[1.6] text-warm-500">
              {copy.checkout.securityNote}
            </p>

            <MobileSummary locale={locale} copy={copy} discount={discount} />

            {/* Un seul formulaire, tout est saisissable d'emblée : la
                validation native du navigateur signale les champs manquants
                au moment de payer, sans étape intermédiaire. */}
            <form onSubmit={submit} noValidate={false}>
              <Section index={1} title={copy.checkout.stepContact}>
                <div className="grid gap-3.5 max-w-[440px]">
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder={copy.checkout.email}
                    aria-label={copy.checkout.email}
                    className="w-full font-sans text-[15px] text-ink bg-ivory border border-ink/20 px-3.5 py-3.5 outline-none focus:border-champagne"
                  />
                  <p className="font-sans text-[13px] leading-[1.6] text-warm-500">
                    {copy.checkout.emailHelp}
                  </p>
                </div>
              </Section>

              <Section index={2} title={copy.checkout.shipping}>
                <div className="max-w-[520px]">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <Input
                      value={form.firstName}
                      onChange={(v) => update("firstName", v)}
                      placeholder={copy.checkout.firstName}
                      autoComplete="given-name"
                      required
                    />
                    <Input
                      value={form.lastName}
                      onChange={(v) => update("lastName", v)}
                      placeholder={copy.checkout.lastName}
                      autoComplete="family-name"
                      required
                    />
                  </div>
                  <Input
                    value={form.line1}
                    onChange={(v) => update("line1", v)}
                    placeholder={copy.checkout.address}
                    autoComplete="address-line1"
                    required
                    className="mb-3"
                  />
                  <div className="grid grid-cols-[130px_1fr] gap-3 mb-3">
                    <Input
                      value={form.zip}
                      onChange={(v) => update("zip", v)}
                      placeholder={copy.checkout.zip}
                      autoComplete="postal-code"
                      required
                    />
                    <Input
                      value={form.city}
                      onChange={(v) => update("city", v)}
                      placeholder={copy.checkout.city}
                      autoComplete="address-level2"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      value={form.country}
                      onChange={(v) => update("country", v)}
                      placeholder={copy.checkout.country}
                      autoComplete="country-name"
                      required
                    />
                    <Input
                      value={form.phone}
                      onChange={(v) => update("phone", v)}
                      placeholder={copy.checkout.phone}
                      autoComplete="tel"
                      type="tel"
                    />
                  </div>

                  <div className="flex items-center gap-3.5 py-[15px] mt-[26px] border-y border-ink/12">
                    <span
                      aria-hidden
                      className="w-[15px] h-[15px] border border-champagne rounded-full flex items-center justify-center shrink-0"
                    >
                      <span className="w-[7px] h-[7px] bg-champagne rounded-full block" />
                    </span>
                    <span className="flex-1">
                      <span className="block font-sans text-[15px] text-ink">
                        {copy.checkout.freeShippingLabel}
                      </span>
                      <span className="block font-sans text-[13px] leading-[1.5] text-warm-500 mt-[3px]">
                        {copy.checkout.freeShippingDetail}
                      </span>
                    </span>
                    <span className="font-sans text-[15px] text-warm-700">
                      {copy.common.free}
                    </span>
                  </div>
                </div>
              </Section>

              <Section
                index={3}
                title={copy.checkout.stepPayment}
                aside={
                  <span className="font-sans text-[12px] text-warm-500">
                    {copy.checkout.paymentMethods}
                  </span>
                }
              >
                {/* Le nœud confié à Stripe reste vide côté React : le
                    squelette est un frère, jamais un enfant. */}
                <div className="relative min-h-[220px]">
                  <div ref={mountRef} />
                  {!ready && (
                    <div className="absolute inset-0 flex flex-col gap-3 pt-1 bg-ivory">
                      <div className="h-[46px] bg-sand animate-pulse rounded-xs" />
                      <div className="grid grid-cols-2 gap-3">
                        <div className="h-[46px] bg-sand animate-pulse rounded-xs" />
                        <div className="h-[46px] bg-sand animate-pulse rounded-xs" />
                      </div>
                      <span className="font-sans text-[12px] text-warm-500">
                        {copy.checkout.paymentLoading}
                      </span>
                    </div>
                  )}
                </div>

                {error && (
                  <p role="alert" className="font-sans text-[13px] text-red-700 mt-4">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting || (available && !ready)}
                  className="w-full mt-6 font-sans text-[14px] tracking-[0.1em] uppercase text-ivory-light bg-ink py-[19px] rounded-xs hover:bg-champagne transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-default"
                >
                  {submitting
                    ? copy.checkout.processing
                    : copy.checkout.pay.replace(
                        "{amount}",
                        formatPriceLocale(total, locale),
                      )}
                </button>

                <div className="flex flex-wrap gap-x-3 gap-y-1.5 justify-center mt-[18px] font-sans text-[12px] leading-[1.5] text-warm-500">
                  {copy.checkout.reassurance.map((line, i) => (
                    <span key={line} className="flex items-center gap-3">
                      {i > 0 && (
                        <span aria-hidden className="opacity-40">
                          ·
                        </span>
                      )}
                      {line}
                    </span>
                  ))}
                </div>
              </Section>
            </form>
          </div>

          <OrderSummary
            locale={locale}
            copy={copy}
            promoCode={promoCode}
            onPromoCodeChange={setPromoCode}
            onApplyPromo={checkPromo}
            promo={promo}
          />
        </div>
      </div>
    </div>
  );
}

/** Section numérotée. Repère visuel uniquement : rien n'est masqué. */
function Section({
  index,
  title,
  children,
  aside,
}: {
  index: number;
  title: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <section className="border-t border-ink/14 mt-[26px] pt-[26px] first:mt-[30px]">
      <div className="flex items-center gap-3.5">
        <span
          aria-hidden
          className="w-[26px] h-[26px] border border-champagne rounded-full flex items-center justify-center font-sans text-[12px] text-champagne shrink-0"
        >
          {index}
        </span>
        <h2 className="font-serif text-[21px] leading-[1.2] text-ink flex-1">{title}</h2>
        {aside}
      </div>
      <div className="pt-5 ps-0 sm:ps-10">{children}</div>
    </section>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  autoComplete,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      required={required}
      autoComplete={autoComplete}
      placeholder={placeholder}
      aria-label={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={[
        "w-full font-sans text-[15px] text-ink bg-ivory border border-ink/20 px-3.5 py-3.5 outline-none focus:border-champagne",
        className,
      ].join(" ")}
    />
  );
}
