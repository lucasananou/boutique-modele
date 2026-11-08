"use client";

import { useEffect, useState } from "react";
import { CART_EVENT, cartTotals, eur, readCart, setQuantity, type CartLine } from "./cart";

/*
 * Commande : récapitulatif du panier + coordonnées et adresse de livraison
 * (France), puis /api/checkout (prix recalculés en base) → Stripe Checkout, ou
 * validation directe en mode démo (aucune clé Stripe).
 */

type Field = "email" | "fullName" | "line1" | "line2" | "city" | "zip" | "phone";

export default function CheckoutForm({
  defaultEmail,
  defaultName,
  signedIn,
  testMode,
}: {
  defaultEmail?: string;
  defaultName?: string;
  signedIn: boolean;
  testMode: boolean;
}) {
  const [lines, setLines] = useState<CartLine[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [badField, setBadField] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const sync = () => setLines(readCart());
    sync();
    window.addEventListener(CART_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CART_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (lines === null) return <div className="shop-card" aria-busy="true" style={{ minHeight: 320 }} />;

  if (lines.length === 0) {
    return (
      <div className="shop-card">
        <h2>Votre panier est vide</h2>
        <p>Choisissez d’abord votre thé.</p>
        <a className="btn btn--sapin" href="/#produits">Découvrir nos thés</a>
      </div>
    );
  }

  const t = cartTotals(lines);
  const subscription = lines.find((l) => l.intervalDays);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!lines) return;
    setError(null);
    setBadField(null);
    const f = new FormData(e.currentTarget);
    const v = (k: Field) => String(f.get(k) ?? "").trim();
    setSending(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale: "fr",
          email: v("email"),
          shipping: {
            fullName: v("fullName"),
            line1: v("line1"),
            line2: v("line2") || undefined,
            city: v("city"),
            zip: v("zip"),
            country: "FR",
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
        setError(data.error ?? "Impossible de lancer le paiement. Réessayez.");
        setBadField(data.field ?? null);
        setSending(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Erreur réseau. Vérifiez votre connexion et réessayez.");
      setSending(false);
    }
  }

  const invalid = (k: Field) => (badField === k ? { "aria-invalid": true as const } : {});

  return (
    <div className="shop-grid">
      <form className="shop-card" onSubmit={submit}>
        <h2>Contact</h2>
        <div className="form-grid">
          <label className="full">
            E-mail
            <input className="shop-input" type="email" name="email" required autoComplete="email" defaultValue={defaultEmail} {...invalid("email")} />
          </label>
        </div>
        {!signedIn && (
          <p className="fine" style={{ marginTop: 10 }}>
            Déjà un compte ? <a href="/compte/connexion?next=/commande">Connectez-vous</a> pour retrouver cette commande.
          </p>
        )}

        <h2 style={{ marginTop: 28 }}>Adresse de livraison</h2>
        <div className="form-grid">
          <label className="full">
            Nom complet
            <input className="shop-input" name="fullName" required minLength={2} autoComplete="name" defaultValue={defaultName} {...invalid("fullName")} />
          </label>
          <label className="full">
            Adresse
            <input className="shop-input" name="line1" required minLength={3} autoComplete="address-line1" {...invalid("line1")} />
          </label>
          <label className="full">
            <span>Complément <small>(facultatif)</small></span>
            <input className="shop-input" name="line2" autoComplete="address-line2" />
          </label>
          <label>
            Code postal
            <input className="shop-input" name="zip" required autoComplete="postal-code" {...invalid("zip")} />
          </label>
          <label>
            Ville
            <input className="shop-input" name="city" required autoComplete="address-level2" {...invalid("city")} />
          </label>
          <label className="full">
            Pays
            <input className="shop-input" value="France" readOnly aria-readonly="true" tabIndex={-1} />
          </label>
          <label className="full">
            <span>Téléphone <small>(facultatif, pour la livraison)</small></span>
            <input className="shop-input" type="tel" name="phone" autoComplete="tel" {...invalid("phone")} />
          </label>
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn--sapin btn--wide" type="submit" disabled={sending} style={{ marginTop: 18 }}>
          {sending ? "Un instant…" : testMode ? `Valider la commande de test · ${eur(t.total)}` : `Payer · ${eur(t.total)}`}
        </button>
        <p className="fine" style={{ marginTop: 12, textAlign: "center" }}>
          {testMode ? "Mode test : aucun paiement réel, aucune carte demandée." : "Paiement sécurisé par Stripe : nous ne voyons jamais votre carte."}
          {subscription && ` L’abonnement se renouvelle tous les ${subscription.intervalDays} jours jusqu’à résiliation, sans engagement.`}
        </p>
      </form>

      <aside className="shop-card">
        <h2>Votre commande</h2>
        {lines.map((l) => (
          <div className="sum-line" key={l.key}>
            <img src={l.img} alt="" />
            <div>
              {l.name}, {l.size}
              <small>
                {l.intervalDays ? `Abonnement, tous les ${l.intervalDays} jours` : "Achat unique"} · Qté{" "}
                <button type="button" className="text-link" aria-label="Retirer une unité" onClick={() => setQuantity(l.key, l.quantity - 1)}>−</button>{" "}
                {l.quantity}{" "}
                <button type="button" className="text-link" aria-label="Ajouter une unité" onClick={() => setQuantity(l.key, l.quantity + 1)}>+</button>
              </small>
            </div>
            <b>{eur(l.unitPrice * l.quantity)}</b>
          </div>
        ))}
        <div className="sum-total" style={{ marginTop: 10 }}><span>Sous-total</span><span>{eur(t.subtotal)}</span></div>
        <div className="sum-total"><span>Livraison</span><span>{t.shipping ? eur(t.shipping) : "Offerte"}</span></div>
        <div className="sum-total grand"><span>Total TTC</span><span>{eur(t.total)}</span></div>
      </aside>
    </div>
  );
}
