"use client";

import { create } from "zustand";

export interface LiveSession {
  id: string;
  anonymousId: string;
  status: string;
  currentPage: string | null;
  country: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  cartItemsCount: number;
  cartValue: number;
  orderValue: number | null;
  lastSeenAt: string;
  createdAt: string;
}

export interface LiveEventRow {
  id: string;
  sessionId: string;
  eventType: string;
  page: string | null;
  productName: string | null;
  productSlug: string | null;
  cartValue: number | null;
  orderValue: number | null;
  orderRef: string | null;
  createdAt: string;
  session: {
    country: string | null;
    city: string | null;
    anonymousId: string;
  };
}

export interface LiveStats {
  visitors: number;
  carts: number;
  cartValue: number;
  checkouts: number;
  recentPurchaseCount: number;
  recentPurchaseValue: number;
  /** Totaux « aujourd'hui » (style Shopify Live View). */
  sessionsToday: number;
  salesTodayValue: number;
  ordersToday: number;
  /** Pages vues par tranche d'1 min sur les 10 dernières minutes (10 valeurs). */
  pageViewsSeries: number[];
}

const DEFAULT_STATS: LiveStats = {
  visitors: 0,
  carts: 0,
  cartValue: 0,
  checkouts: 0,
  recentPurchaseCount: 0,
  recentPurchaseValue: 0,
  sessionsToday: 0,
  salesTodayValue: 0,
  ordersToday: 0,
  pageViewsSeries: [],
};

interface LiveStore {
  sessions: LiveSession[];
  events: LiveEventRow[];
  stats: LiveStats;
  connected: boolean;
  /** true dès qu'un premier snapshot temps réel est arrivé. */
  hasSnapshot: boolean;
  setSnapshot: (data: {
    sessions: LiveSession[];
    events: LiveEventRow[];
    stats: LiveStats;
  }) => void;
  setConnected: (v: boolean) => void;
}

export const useLiveStore = create<LiveStore>((set) => ({
  sessions: [],
  events: [],
  stats: DEFAULT_STATS,
  connected: false,
  hasSnapshot: false,
  setSnapshot: ({ sessions, events, stats }) =>
    set({ sessions, events, stats, hasSnapshot: true }),
  setConnected: (connected) => set({ connected }),
}));
