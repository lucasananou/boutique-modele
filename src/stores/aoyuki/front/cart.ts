"use client";

import { store } from "@/stores";

/*
 * Panier Aoyuki (navigateur) : lignes produit + format (+ fréquence si
 * abonnement), en localStorage. Les prix servent à l'affichage ; le serveur
 * les recalcule depuis la base au passage en caisse (/api/checkout).
 */

export interface CartLine {
  key: string;
  handle: string;
  productId: string;
  slug: string;
  variantId: string;
  name: string;
  size: string;
  /** Centimes, déjà remisé pour un abonnement. */
  unitPrice: number;
  quantity: number;
  intervalDays?: number;
  img: string;
}

export const CART_KEY = "aoyuki:panier";
export const CART_EVENT = "aoyuki:panier";
/** Règles d'affichage tirées de la config (le serveur fait foi au checkout). */
const SHIPPING = store.commerce.shipping ?? { flatRate: 0, freeOver: 0 };
export const FREE_OVER = SHIPPING.freeOver ?? 0;

export const eur = (cents: number) =>
  (cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

export function readCart(): CartLine[] {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(raw) ? raw.filter((l) => l && l.variantId && l.quantity > 0) : [];
  } catch {
    return [];
  }
}

export function writeCart(lines: CartLine[]) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(lines));
  } catch {
    /* navigation privée : panier non persisté */
  }
  window.dispatchEvent(new Event(CART_EVENT));
}

/** Un seul abonnement par commande : un nouvel abonnement remplace le précédent. */
export function addLine(line: Omit<CartLine, "key" | "quantity">, quantity = 1): "added" | "replaced" {
  const key = `${line.variantId}::${line.intervalDays ?? "unique"}`;
  let lines = readCart();
  let result: "added" | "replaced" = "added";
  if (line.intervalDays) {
    const before = lines.length;
    lines = lines.filter((l) => !l.intervalDays || l.key === key);
    if (lines.length !== before) result = "replaced";
  }
  const existing = lines.find((l) => l.key === key);
  if (existing) existing.quantity = Math.min(10, existing.quantity + quantity);
  else lines.push({ ...line, key, quantity: Math.min(10, quantity) });
  writeCart(lines);
  return result;
}

export function setQuantity(key: string, quantity: number) {
  writeCart(
    readCart()
      .map((l) => (l.key === key ? { ...l, quantity: Math.max(0, Math.min(10, quantity)) } : l))
      .filter((l) => l.quantity > 0),
  );
}

export function removeLine(key: string) {
  writeCart(readCart().filter((l) => l.key !== key));
}

export function clearCart() {
  writeCart([]);
}

export function cartTotals(lines: CartLine[]) {
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const hasSub = lines.some((l) => l.intervalDays);
  const free = lines.length === 0 || hasSub || (SHIPPING.freeOver !== null && subtotal >= SHIPPING.freeOver);
  const shipping = free ? 0 : SHIPPING.flatRate;
  return {
    subtotal,
    shipping,
    total: subtotal + shipping,
    hasSub,
    count: lines.reduce((n, l) => n + l.quantity, 0),
  };
}

