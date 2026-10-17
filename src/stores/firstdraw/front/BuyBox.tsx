"use client";

import { useEffect, useRef, useState } from "react";
import { addAttrs, perServing, usd, type Catalog } from "./packs";

/* Fiche produit : packs et abonnement lus en base (props), ajout au sac par
   les attributs data-* (Interactions.tsx). Mise en page de la maquette. */

const TITLES: Record<number, string> = { 1: "One jar", 2: "Two jars", 3: "Three jars" };

export default function BuyBox({
  catalog,
  intervals,
  discountPercent,
}: {
  catalog: Catalog;
  intervals: readonly number[];
  discountPercent: number;
}) {
  const packs = catalog.packs;
  const popular = packs.find((p) => p.units === 2) ?? packs[0];
  const [packId, setPackId] = useState(popular.variantId);
  const [sub, setSub] = useState(true);
  const pack = packs.find((p) => p.variantId === packId) ?? popular;
  const defaultInterval = (units: number) =>
    intervals.includes(units * 30) ? units * 30 : intervals[0];
  const [interval, setCadence] = useState(defaultInterval(pack.units));

  const price = sub ? pack.subPrice : pack.price;
  const per = perServing(price, pack.units);
  const btn = useRef<HTMLButtonElement>(null);
  const [showSticky, setShowSticky] = useState(false);
  useEffect(() => {
    const el = btn.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) =>
      setShowSticky(!e.isIntersecting && e.boundingClientRect.top < 0),
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const attrs = addAttrs(catalog, pack, sub ? interval : undefined);
  const title = TITLES[pack.units] ?? pack.label;

  return (
    <>
      <div className="buy">
        <p className="hand lead">The first scoop of your day.</p>
        <h1>Colostrum 575</h1>
        <p className="lede">
          Grass-fed bovine colostrum, 2,300 mg per scoop standardized to 575
          mg of IgG. Supports gut health and immune function.*
        </p>
        <div className="spec">
          <span>
            Product
            <br />
            Bovine colostrum
          </span>
          <span>
            Quantity
            <br />
            30 servings per jar
          </span>
        </div>

        <div className="price-line">
          <span className="price-now">{usd(price)}</span>
          <span className="price-each">
            {per} a serving, {sub ? "subscription" : "one-time"}
          </span>
        </div>

        <div className="packs">
          {packs.map((p) => (
            <button
              key={p.variantId}
              type="button"
              className="pack"
              aria-pressed={p.variantId === pack.variantId}
              onClick={() => {
                setPackId(p.variantId);
                setCadence(defaultInterval(p.units));
              }}
            >
              {p === popular && <span className="card-tag">Most popular</span>}
              <img src={p.img} alt="" />
              <span className="pk-title">{TITLES[p.units] ?? p.label}</span>
              <span className="pk-sub">
                {p.units * 30} servings, {perServing(p.price, p.units)} each
              </span>
              <span className="pk-price">
                ${p.price / 100}
                {p.was > p.price && <s>${p.was / 100}</s>}
              </span>
            </button>
          ))}
        </div>

        <div className="plans">
          <button
            type="button"
            className="plan"
            aria-pressed={sub}
            onClick={() => setSub(true)}
          >
            <span className="pl-top">
              <span>
                <span className="radio" />
                Subscribe &amp; save
                <span className="tag yellow">−{discountPercent}%</span>
              </span>
              <span>{usd(pack.subPrice)}</span>
            </span>
            <span className="pl-note">
              Delivered every {interval} days, always free shipping. Skip, move
              or cancel online in one click.
            </span>
          </button>
          {sub && intervals.length > 1 && (
            <div className="cadence" role="group" aria-label="Delivery frequency">
              <span>Deliver every</span>
              {intervals.map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={d === interval}
                  onClick={() => setCadence(d)}
                >
                  {d} days
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            className="plan"
            aria-pressed={!sub}
            onClick={() => setSub(false)}
          >
            <span className="pl-top">
              <span>
                <span className="radio" />
                One-time purchase
              </span>
              <span>{usd(pack.price)}</span>
            </span>
            <span className="pl-note">
              No commitment. Free shipping over $50.
            </span>
          </button>
        </div>

        <button ref={btn} type="button" className="pill buy-btn" {...attrs}>
          {`Add to Cart – ${usd(price)}`}
        </button>
        <p className="fine" style={{ marginTop: 10, textAlign: "center" }}>
          Secure checkout by Stripe. Subscriptions renew at the discounted
          price until you cancel.
        </p>

        <ul className="reassure">
          <li>Ships from the US in 2 to 5 business days</li>
          <li>60-day money-back guarantee, opened jars included</li>
          <li>Every lot tested before it ships</li>
          <li>One ingredient, nothing added</li>
        </ul>
      </div>

      <div className={showSticky ? "sticky-atc on" : "sticky-atc"}>
        <div>
          <b>{usd(price)}</b>
          <span>
            {title}, {per} a serving{sub ? ", subscription" : ""}
          </span>
        </div>
        <button type="button" className="pill" {...attrs}>
          Add to Cart
        </button>
      </div>
    </>
  );
}
