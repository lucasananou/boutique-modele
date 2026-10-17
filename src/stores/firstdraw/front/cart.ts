"use client";

import { store } from "@/stores";

/*
 * Sac FIRST DRAW (navigateur) : lignes produit + variante (+ fréquence si
 * abonnement), en localStorage. Les prix servent à l'affichage ; le serveur
 * les recalcule depuis la base au checkout (/api/checkout).
 */

export interface BagLine {
  key: string;
  productId: string;
  slug: string;
  variantId: string;
  /** Libellé affiché, ex. « Colostrum 575, two jars ». */
  name: string;
  pack: string;
  /** Prix unitaire en cents (déjà remisé pour un abonnement). */
  unitPrice: number;
  quantity: number;
  /** Abonnement : fréquence en jours. */
  intervalDays?: number;
  img: string;
}

export const BAG_KEY = "firstdraw:bag";
export const BAG_EVENT = "firstdraw:bag";

/** Règles d'affichage tirées de la config (le serveur fait foi). */
const SHIPPING = store.commerce.shipping ?? { flatRate: 0, freeOver: 0 };

export function readBag(): BagLine[] {
  try {
    const raw = JSON.parse(localStorage.getItem(BAG_KEY) || "[]");
    return Array.isArray(raw) ? raw.filter((l) => l && l.variantId && l.quantity > 0) : [];
  } catch {
    return [];
  }
}

export function writeBag(lines: BagLine[]) {
  localStorage.setItem(BAG_KEY, JSON.stringify(lines));
  window.dispatchEvent(new Event(BAG_EVENT));
}

/**
 * Ajoute une ligne. Un seul abonnement par commande (Stripe : une fréquence
 * par abonnement) : un nouvel abonnement remplace le précédent.
 */
export function addToBag(line: Omit<BagLine, "key" | "quantity">, quantity = 1): "added" | "replaced" {
  const key = `${line.variantId}::${line.intervalDays ?? "once"}`;
  let lines = readBag();
  let result: "added" | "replaced" = "added";
  if (line.intervalDays) {
    const before = lines.length;
    lines = lines.filter((l) => !l.intervalDays || l.key === key);
    if (lines.length !== before) result = "replaced";
  }
  const existing = lines.find((l) => l.key === key);
  if (existing) {
    existing.quantity = Math.min(10, existing.quantity + quantity);
  } else {
    lines.push({ ...line, key, quantity });
  }
  writeBag(lines);
  return result;
}

export function setQuantity(key: string, quantity: number) {
  const lines = readBag()
    .map((l) => (l.key === key ? { ...l, quantity: Math.max(0, Math.min(10, quantity)) } : l))
    .filter((l) => l.quantity > 0);
  writeBag(lines);
}

export function clearBag() {
  writeBag([]);
}

export function bagTotals(lines: BagLine[]) {
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const hasSub = lines.some((l) => l.intervalDays);
  const shipping =
    lines.length === 0 || hasSub || (SHIPPING.freeOver !== null && subtotal >= SHIPPING.freeOver) ? 0 : SHIPPING.flatRate;
  return { subtotal, shipping, total: subtotal + shipping, hasSub, count: lines.reduce((n, l) => n + l.quantity, 0) };
}

export const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;
