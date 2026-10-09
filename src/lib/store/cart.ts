"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { trackEvent } from "@/lib/live/client";

export interface CartLine {
  /** Clé unique = productId + variantId. */
  key: string;
  productId: string;
  slug: string;
  name: string;
  materialLabel: string;
  /** Prix unitaire en centimes (variante incluse). */
  unitPrice: number;
  image: { src: string; alt: string };
  variantId?: string;
  variantLabel?: string;
  quantity: number;
  /** Message de gravure éventuel. */
  engraving?: string;
}

export interface AddToCartInput {
  productId: string;
  slug: string;
  name: string;
  materialLabel: string;
  unitPrice: number;
  image: { src: string; alt: string };
  variantId?: string;
  variantLabel?: string;
  engraving?: string;
}

interface CartState {
  lines: CartLine[];
  isOpen: boolean;
  giftWrap: boolean;
  add: (item: AddToCartInput, quantity?: number) => void;
  remove: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  clear: () => void;
  toggleGiftWrap: (value?: boolean) => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

function lineKey(productId: string, variantId?: string, engraving?: string) {
  return [productId, variantId ?? "_", engraving ? "g" : "_"].join("::");
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      isOpen: false,
      giftWrap: false,

      add: (item, quantity = 1) => {
        set((state) => {
          const key = lineKey(item.productId, item.variantId, item.engraving);
          const existing = state.lines.find((l) => l.key === key);
          if (existing) {
            return {
              isOpen: true,
              lines: state.lines.map((l) =>
                l.key === key
                  ? { ...l, quantity: l.quantity + quantity }
                  : l,
              ),
            };
          }
          return {
            isOpen: true,
            lines: [...state.lines, { ...item, key, quantity }],
          };
        });
        const { lines } = get();
        trackEvent("ADD_TO_CART", {
          productId: item.productId,
          productName: item.name,
          productSlug: item.slug,
          cartItemsCount: lines.reduce((n, l) => n + l.quantity, 0),
          cartValue: lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0),
        });
      },

      remove: (key) => {
        set((state) => ({
          lines: state.lines.filter((l) => l.key !== key),
        }));
        const { lines } = get();
        trackEvent("REMOVE_FROM_CART", {
          cartItemsCount: lines.reduce((n, l) => n + l.quantity, 0),
          cartValue: lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0),
        });
      },

      setQuantity: (key, quantity) => {
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((l) => l.key !== key)
              : state.lines.map((l) =>
                  l.key === key ? { ...l, quantity } : l,
                ),
        }));
        const { lines } = get();
        trackEvent("CART_UPDATE", {
          cartItemsCount: lines.reduce((n, l) => n + l.quantity, 0),
          cartValue: lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0),
        });
      },

      clear: () => set({ lines: [], giftWrap: false }),

      toggleGiftWrap: (value) =>
        set((state) => ({
          giftWrap: value ?? !state.giftWrap,
        })),

      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
    }),
    {
      name: "maison-cart",
      partialize: (state) => ({
        lines: state.lines,
        giftWrap: state.giftWrap,
      }),
    },
  ),
);

/* Sélecteurs dérivés (à utiliser avec useCart(selector)). */
export const selectCount = (s: CartState) =>
  s.lines.reduce((n, l) => n + l.quantity, 0);

export const selectSubtotal = (s: CartState) =>
  s.lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
