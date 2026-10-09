"use client";

import { useEffect, useRef } from "react";
import { trackEvent, gaItem } from "@/lib/analytics";
import { trackEvent as liveTrack } from "@/lib/live/client";

/** view_item — à monter sur une fiche produit (composant serveur → ce client). */
export function TrackView({
  slug,
  name,
  priceCents,
  category,
}: {
  slug: string;
  name: string;
  priceCents: number;
  category?: string;
}) {
  useEffect(() => {
    const item = gaItem({ slug, name, priceCents, category });
    trackEvent("view_item", { currency: "EUR", value: item.price, items: [item] });
    liveTrack("PRODUCT_VIEW", { productSlug: slug, productName: name });
  }, [slug, name, priceCents, category]);
  return null;
}

interface PurchaseItem {
  slug: string;
  name: string;
  priceCents: number;
  quantity: number;
  variantLabel?: string;
}

/** purchase — à monter sur la page de confirmation. Anti-doublon via sessionStorage. */
export function TrackPurchase({
  id,
  valueCents,
  items,
  currency,
}: {
  id: string;
  valueCents: number;
  items: PurchaseItem[];
  currency?: string;
}) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    const key = `ga_purchase_${id}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // sessionStorage indisponible : on retombe sur le garde useRef.
    }
    sent.current = true;
    trackEvent("purchase", {
      transaction_id: id,
      // Devise reellement facturee : sans elle, GA additionnerait des dollars
      // et des shekels comme des euros.
      currency: (currency ?? "EUR").toUpperCase(),
      value: Math.round(valueCents) / 100,
      items: items.map((i) =>
        gaItem({
          slug: i.slug,
          name: i.name,
          priceCents: i.priceCents,
          quantity: i.quantity,
          variantLabel: i.variantLabel,
        }),
      ),
    });
    liveTrack("PURCHASE", { orderValue: valueCents, orderRef: id });
  }, [id, valueCents, items, currency]);
  return null;
}
