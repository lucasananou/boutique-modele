"use client";

import { useEffect, useState } from "react";
import { CART_EVENT, cartTotals, eur, readCart, removeLine, setQuantity, type CartLine } from "./cart";

/** Page panier complète (le tiroir reste l'entrée principale). */
export default function PanierView() {
  const [lines, setLines] = useState<CartLine[] | null>(null);
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
  if (lines === null) return <div className="shop-card" aria-busy="true" style={{ minHeight: 240 }} />;
  if (lines.length === 0) {
    return (
      <div className="shop-card">
        <h2>Votre panier est vide</h2>
        <a className="btn btn--plein" href="/boutique">Voir nos bolas</a>
      </div>
    );
  }
  const t = cartTotals(lines);
  return (
    <div className="shop-grid">
      <div className="shop-card">
        {lines.map((l) => (
          <div className="sum-line" key={l.key}>
            <img src={l.img} alt="" />
            <div>
              {l.name}, {l.size}
              <small>
                {l.intervalDays ? `Abonnement, tous les ${l.intervalDays} jours` : "Achat unique"} · Qté{" "}
                <button type="button" className="text-link" aria-label="Retirer une unité" onClick={() => setQuantity(l.key, l.quantity - 1)}>−</button>{" "}
                {l.quantity}{" "}
                <button type="button" className="text-link" aria-label="Ajouter une unité" onClick={() => setQuantity(l.key, l.quantity + 1)}>+</button>{" "}
                · <button type="button" className="text-link" onClick={() => removeLine(l.key)}>Supprimer</button>
              </small>
            </div>
            <b>{eur(l.unitPrice * l.quantity)}</b>
          </div>
        ))}
      </div>
      <aside className="shop-card">
        <h2>Total</h2>
        <div className="sum-total"><span>Sous-total</span><span>{eur(t.subtotal)}</span></div>
        <div className="sum-total"><span>Livraison</span><span>{t.shipping ? eur(t.shipping) : "Offerte"}</span></div>
        <div className="sum-total grand"><span>Total TTC</span><span>{eur(t.total)}</span></div>
        <a className="btn btn--plein btn--wide" href="/commande" style={{ marginTop: 16, display: "flex", justifyContent: "center" }}>Commander</a>
      </aside>
    </div>
  );
}
