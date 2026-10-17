"use client";

import { useEffect, useState } from "react";
import { bagTotals, readBag, setQuantity, BAG_EVENT, usd, type BagLine } from "./cart";
import { trackPixel } from "./Pixels";

/*
 * Checkout : récapitulatif du sac + coordonnées et adresse US, puis
 * /api/checkout (prix recalculés en base) → Stripe Checkout, ou validation
 * directe en mode démo (aucune clé Stripe).
 */

type Field = "email" | "fullName" | "line1" | "line2" | "city" | "state" | "zip" | "phone";

export default function CheckoutForm({
  states,
  defaultEmail,
  defaultName,
  signedIn,
}: {
  states: readonly [string, string][];
  defaultEmail?: string;
  defaultName?: string;
  signedIn: boolean;
}) {
  const [lines, setLines] = useState<BagLine[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [badField, setBadField] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const sync = () => setLines(readBag());
    sync();
    window.addEventListener(BAG_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(BAG_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (lines === null) return <div className="shop-card" aria-busy="true" style={{ minHeight: 320 }} />;

  if (lines.length === 0) {
    return (
      <div className="shop-card">
        <h2>Your bag is empty</h2>
        <p>Your first morning scoop starts here.</p>
        <a className="pill" href="/#shop">
          Shop the packs ↗
        </a>
      </div>
    );
  }

  const t = bagTotals(lines);
  const subscriptions = lines.filter((l) => l.intervalDays);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!lines) return;
    setError(null);
    setBadField(null);
    const f = new FormData(e.currentTarget);
    const v = (k: Field) => String(f.get(k) ?? "").trim();
    setSending(true);
    trackPixel("InitiateCheckout", { value: t.total / 100, currency: "USD" });
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale: "en",
          email: v("email"),
          shipping: {
            fullName: v("fullName"),
            line1: v("line1"),
            line2: v("line2") || undefined,
            city: v("city"),
            state: v("state"),
            zip: v("zip"),
            country: "US",
            phone: v("phone") || undefined,
          },
          lines: lines.map((l) => ({
            productId: l.productId,
            slug: l.slug,
            variantId: l.variantId,
            quantity: l.quantity,
            ...(l.intervalDays ? { intervalDays: l.intervalDays } : {}),
          })),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string; field?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "We couldn't start the payment. Please try again.");
        setBadField(data.field ?? null);
        setSending(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error. Please check your connection and try again.");
      setSending(false);
    }
  }

  const invalid = (k: Field) => (badField === k ? { "aria-invalid": true as const } : {});

  return (
    <div className="shop-grid">
      <form className="shop-card" onSubmit={submit} noValidate={false}>
        <h2>Contact</h2>
        <div className="form-grid">
          <label className="full">
            Email
            <input className="field" type="email" name="email" required autoComplete="email" defaultValue={defaultEmail} {...invalid("email")} />
          </label>
        </div>
        {!signedIn && (
          <p className="fine" style={{ marginTop: 10 }}>
            Have an account? <a href="/account/login?next=/checkout" style={{ textDecoration: "underline" }}>Sign in</a> to see this order in it later.
          </p>
        )}

        <h2 style={{ marginTop: 34 }}>Shipping address</h2>
        <div className="form-grid">
          <label className="full">
            Full name
            <input className="field" name="fullName" required minLength={2} autoComplete="name" defaultValue={defaultName} {...invalid("fullName")} />
          </label>
          <label className="full">
            Street address
            <input className="field" name="line1" required minLength={3} autoComplete="address-line1" {...invalid("line1")} />
          </label>
          <label className="full">
            <span>
              Apartment, suite, unit <small>(optional)</small>
            </span>
            <input className="field" name="line2" autoComplete="address-line2" />
          </label>
          <label>
            City
            <input className="field" name="city" required autoComplete="address-level2" {...invalid("city")} />
          </label>
          <label>
            State
            <select className="field" name="state" required autoComplete="address-level1" defaultValue="" {...invalid("state")}>
              <option value="" disabled>
                Choose…
              </option>
              {states.map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label>
            ZIP code
            <input
              className="field"
              name="zip"
              required
              inputMode="numeric"
              pattern="\d{5}(-\d{4})?"
              title="5-digit US ZIP code"
              autoComplete="postal-code"
              {...invalid("zip")}
            />
          </label>
          <label>
            Country
            <input className="field" value="United States" readOnly aria-readonly="true" tabIndex={-1} />
          </label>
          <label className="full">
            <span>
              Phone <small>(optional, for delivery issues only)</small>
            </span>
            <input className="field" type="tel" name="phone" autoComplete="tel" {...invalid("phone")} />
          </label>
        </div>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="pill wide-btn" type="submit" disabled={sending}>
          {sending ? "One moment…" : `Continue to payment – ${usd(t.total)}`}
        </button>
        <p className="fine" style={{ marginTop: 12, textAlign: "center" }}>
          We ship to US addresses only. Payment is handled by Stripe; we never see your card.
          {subscriptions.length > 0 &&
            ` Your subscription renews at the discounted price every ${subscriptions[0].intervalDays} days until you cancel, and we email you before each renewal.`}
        </p>
      </form>

      <aside className="shop-card">
        <h2>Your order</h2>
        {lines.map((l) => (
          <div className="sum-line" key={l.key}>
            <img src={l.img} alt="" />
            <div>
              {l.name}
              <small>
                {l.intervalDays ? `Every ${l.intervalDays} days, cancel anytime` : "One-time purchase"} · Qty{" "}
                <button type="button" className="text-link" aria-label="One less" onClick={() => setQuantity(l.key, l.quantity - 1)}>
                  −
                </button>{" "}
                {l.quantity}{" "}
                <button type="button" className="text-link" aria-label="One more" onClick={() => setQuantity(l.key, l.quantity + 1)}>
                  +
                </button>
              </small>
            </div>
            <b>{usd(l.unitPrice * l.quantity)}</b>
          </div>
        ))}
        <div className="sum-total" style={{ marginTop: 10 }}>
          <span>Subtotal</span>
          <span>{usd(t.subtotal)}</span>
        </div>
        <div className="sum-total">
          <span>Shipping</span>
          <span>{t.shipping ? usd(t.shipping) : "Free"}</span>
        </div>
        <div className="sum-total grand">
          <span>Total</span>
          <span>{usd(t.total)}</span>
        </div>
        {!t.hasSub && t.shipping > 0 && <p className="fine">Free shipping from $50, or on any subscription.</p>}
        <ul className="reassure">
          <li>Ships from the US in 2 to 5 business days</li>
          <li>60-day money-back guarantee, opened jars included</li>
          {t.hasSub && <li>Skip, move or cancel online in one click</li>}
        </ul>
      </aside>
    </div>
  );
}
