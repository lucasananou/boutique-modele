import { prisma } from "@/lib/db";
import type { OrderStatus, Prisma } from "@/generated/prisma";
import { PAID_STATUSES } from "@/lib/adminStatus";
import { getAllProducts, getProductBySlug } from "@/lib/products";

export function initials(name?: string | null, fallback = "?"): string {
  if (!name) return fallback;
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Nom affichable d'une commande (User lié > nom de livraison > e-mail). */
function orderCustomerName(o: {
  user?: { name: string | null } | null;
  shippingName: string | null;
  email: string;
}): string {
  return o.user?.name ?? o.shippingName ?? o.email;
}

/* ============== DASHBOARD ============== */

export async function getDashboardData() {
  const orders = await prisma.order.findMany({
    include: { items: true, user: true },
    orderBy: { createdAt: "desc" },
  });

  // Ventes RÉELLES (argent encaissé) vs paniers non payés (PENDING) et annulées.
  // Les PENDING = paniers abandonnés → exclus de tous les KPIs (ils vivent
  // dans /admin/paniers), sinon le CA est gonflé par des paniers jamais payés.
  const PAID_STATUSES = new Set(["PAID", "SHIPPED", "DELIVERED"]);
  const paid = orders.filter((o) => PAID_STATUSES.has(o.status)); // encaissé
  const realOrders = orders.filter((o) => o.status !== "PENDING"); // vraies commandes (dont annulées)
  const revenue = paid.reduce((s, o) => s + netPaid(o), 0);
  const orderCount = realOrders.length;
  const avgBasket = paid.length ? Math.round(revenue / paid.length) : 0;
  // Clientes = acheteuses (e-mails distincts des commandes payées), comptes
  // ou invitées — et non le nombre de comptes inscrits.
  const customerCount = new Set(paid.map((o) => o.email.trim().toLowerCase())).size;

  // Série hebdo sur 12 semaines (chiffre d'affaires).
  const weeks = 12;
  const now = Date.now();
  const msWeek = 7 * 24 * 3600 * 1000;
  const buckets = Array.from({ length: weeks }, () => 0);
  for (const o of paid) {
    const age = now - o.createdAt.getTime();
    const idx = weeks - 1 - Math.floor(age / msWeek);
    if (idx >= 0 && idx < weeks) buckets[idx] += netPaid(o);
  }
  const maxBucket = Math.max(1, ...buckets);
  const revenueSeries = buckets.map((v) => ({
    value: v,
    pct: Math.round((v / maxBucket) * 100),
  }));

  // Produits les plus vendus (agrégés depuis les lignes de commande).
  const unitsBySlug = new Map<string, { units: number; revenue: number }>();
  for (const o of paid) {
    for (const it of o.items) {
      const cur = unitsBySlug.get(it.slug) ?? { units: 0, revenue: 0 };
      cur.units += it.quantity;
      cur.revenue += it.unitPrice * it.quantity;
      unitsBySlug.set(it.slug, cur);
    }
  }
  const catalog = await getAllProducts();
  const topProducts = [...unitsBySlug.entries()]
    .map(([slug, v]) => ({
      slug,
      name: catalog.find((p) => p.slug === slug)?.name ?? slug,
      units: v.units,
      revenue: v.revenue,
    }))
    .sort((a, b) => b.units - a.units)
    .slice(0, 4);

  const recentOrders = realOrders.slice(0, 5).map((o) => ({
    id: o.id,
    reference: o.reference,
    customer: orderCustomerName(o),
    date: o.createdAt,
    status: o.status,
    total: o.amountTotal,
  }));

  const recentCustomers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 3,
    select: { id: true, name: true, email: true },
  });

  return {
    metrics: { revenue, orderCount, avgBasket, customerCount },
    revenueSeries,
    topProducts,
    recentOrders,
    recentCustomers,
  };
}

/* ============== COMMANDES ============== */

export const ORDERS_PAGE_SIZE = 50;

/**
 * Liste admin des commandes : filtre de statut, recherche (référence, e-mail,
 * nom de livraison ou du compte, n° de suivi) et pagination.
 */
export async function getOrders(filter?: string, q?: string, page = 1) {
  // « Toutes » = vraies commandes : on exclut les PENDING (= paniers abandonnés,
  // visibles dans /admin/paniers). Un filtre explicite reste respecté.
  const statusWhere: Prisma.OrderWhereInput =
    filter && filter !== "all"
      ? { status: filter as OrderStatus }
      : { status: { not: "PENDING" } };
  const term = q?.trim();
  const searchWhere: Prisma.OrderWhereInput | undefined = term
    ? {
        OR: [
          { reference: { contains: term, mode: "insensitive" } },
          { email: { contains: term, mode: "insensitive" } },
          { shippingName: { contains: term, mode: "insensitive" } },
          { trackingNumber: { contains: term, mode: "insensitive" } },
          { user: { name: { contains: term, mode: "insensitive" } } },
        ],
      }
    : undefined;
  const where: Prisma.OrderWhereInput = searchWhere
    ? { AND: [statusWhere, searchWhere] }
    : statusWhere;
  const current = Math.max(1, Math.floor(page) || 1);
  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: { user: true },
      orderBy: { createdAt: "desc" },
      skip: (current - 1) * ORDERS_PAGE_SIZE,
      take: ORDERS_PAGE_SIZE,
    }),
  ]);
  return {
    total,
    page: current,
    pages: Math.max(1, Math.ceil(total / ORDERS_PAGE_SIZE)),
    orders: orders.map((o) => ({
      id: o.id,
      reference: o.reference,
      customer: orderCustomerName(o),
      email: o.email,
      date: o.createdAt,
      status: o.status,
      total: o.amountTotal,
    })),
  };
}

export async function getOrderDetail(id: string) {
  const o = await prisma.order.findUnique({
    where: { id },
    include: { items: true, user: true },
  });
  if (!o) return null;
  const subtotal = o.items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
  // Résout la vraie image produit par slug (repli géré à l'affichage).
  const items = await Promise.all(
    o.items.map(async (it) => ({
      ...it,
      image: (await getProductBySlug(it.slug))?.images?.[0]?.src ?? null,
    })),
  );
  // Fiche client : compte s'il existe pour cet e-mail, sinon fiche « invitée ».
  const account =
    o.user ??
    (await prisma.user.findFirst({
      where: { email: { equals: o.email, mode: "insensitive" } },
      select: { id: true, name: true },
    }));
  return {
    ...o,
    items,
    customerName: orderCustomerName(o),
    customerHref: `/admin/clients/${account ? account.id : guestCustomerId(o.email)}`,
    subtotal,
    shipping: Math.max(0, o.amountTotal - (subtotal - o.discountAmount)),
  };
}

/* ============== PANIERS ABANDONNÉS ============== */

export type AbandonedState = "abandoned" | "reminded" | "recovered";

export interface AbandonedCartRow {
  id: string;
  reference: string;
  email: string;
  value: number;
  itemsCount: number;
  date: Date;
  reminders: number;
  state: AbandonedState;
}

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/**
 * Vue des paniers abandonnés (= commandes PENDING). Un panier « past grâce » a
 * plus d'1 h. « Récupéré » = le même e-mail a une commande PAID/SHIPPED/
 * DELIVERED créée après. Fenêtre d'analyse : 14 derniers jours.
 */
export async function getAbandonedCarts() {
  const now = Date.now();
  const windowStart = new Date(now - 14 * DAY_MS);
  const graceCutoff = new Date(now - 1 * HOUR_MS);

  const pending = await prisma.order.findMany({
    where: { status: "PENDING", createdAt: { gte: windowStart } },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  // Commandes « gagnantes » sur la fenêtre, pour détecter les récupérations.
  const emails = [...new Set(pending.map((o) => o.email))];
  const wins = emails.length
    ? await prisma.order.findMany({
        where: {
          email: { in: emails },
          status: { in: ["PAID", "SHIPPED", "DELIVERED"] },
          createdAt: { gte: windowStart },
        },
        select: { email: true, createdAt: true },
      })
    : [];
  const recoveredAt = new Map<string, number>();
  for (const w of wins) {
    const t = w.createdAt.getTime();
    const cur = recoveredAt.get(w.email);
    if (cur === undefined || t < cur) recoveredAt.set(w.email, t);
  }
  const isRecovered = (email: string, at: Date) => {
    const t = recoveredAt.get(email);
    return t !== undefined && t > at.getTime();
  };

  const rows: AbandonedCartRow[] = pending
    // On ignore la période de grâce (< 1 h) pour les KPIs et la table.
    .filter((o) => o.createdAt <= graceCutoff)
    .map((o) => {
      const recovered = isRecovered(o.email, o.createdAt);
      const state: AbandonedState = recovered
        ? "recovered"
        : o.reminderCount > 0
          ? "reminded"
          : "abandoned";
      return {
        id: o.id,
        reference: o.reference,
        email: o.email,
        value: o.amountTotal,
        itemsCount: o.items.reduce((n, it) => n + it.quantity, 0),
        date: o.createdAt,
        reminders: o.reminderCount,
        state,
      };
    });

  const activeAbandoned = rows.filter((r) => r.state !== "recovered");
  const recoveredCount = rows.filter((r) => r.state === "recovered").length;
  const totalConsidered = rows.length;

  const metrics = {
    // Paniers réellement abandonnés (non récupérés).
    abandonedCount: activeAbandoned.length,
    // Valeur cumulée des paniers abandonnés non récupérés.
    abandonedValue: activeAbandoned.reduce((s, r) => s + r.value, 0),
    // Taux de récupération = récupérés / total (récupérés + abandonnés).
    recoveryRate: totalConsidered
      ? Math.round((recoveredCount / totalConsidered) * 100)
      : 0,
    // Paniers ayant reçu au moins une relance.
    remindedCount: rows.filter((r) => r.reminders > 0).length,
    recoveredCount,
  };

  return { rows: rows.slice(0, 50), metrics };
}

/* ============== CLIENTS ============== */

/*
 * Une cliente = un e-mail (en minuscules). Elle peut avoir un compte (User) ou
 * n'avoir commandé qu'en invitée : les deux apparaissent dans la liste.
 * Identifiant de fiche : id du compte, ou « g-<e-mail en base64url> » pour une
 * invitée.
 * Total dépensé = commandes payées (PAID/SHIPPED/DELIVERED), moins les
 * remboursements partiels ; les paniers non payés (PENDING), annulées et
 * remboursées n'y sont jamais comptés.
 */
const GUEST_PREFIX = "g-";

export function guestCustomerId(email: string): string {
  return GUEST_PREFIX + Buffer.from(email.trim().toLowerCase()).toString("base64url");
}

function emailFromGuestId(id: string): string | null {
  if (!id.startsWith(GUEST_PREFIX)) return null;
  try {
    const email = Buffer.from(id.slice(GUEST_PREFIX.length), "base64url").toString("utf8");
    return email.includes("@") ? email : null;
  } catch {
    return null;
  }
}

function isPaid(status: string) {
  return (PAID_STATUSES as string[]).includes(status);
}

/** Montant réellement conservé pour une commande (0 si non payée / remboursée). */
export function netPaid(o: { status: string; amountTotal: number; refundedAmount?: number }) {
  return isPaid(o.status) ? Math.max(0, o.amountTotal - (o.refundedAmount ?? 0)) : 0;
}

export interface CustomerRow {
  id: string;
  name: string;
  email: string;
  hasAccount: boolean;
  /** Commandes payées non remboursées. */
  orders: number;
  spent: number;
  since: Date;
  lastOrder: Date | null;
}

export async function getCustomers(): Promise<CustomerRow[]> {
  const [users, orders] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, createdAt: true },
    }),
    // Une seule requête (au lieu d'une par cliente). Les paniers non payés ne
    // font pas d'une adresse une cliente.
    prisma.order.findMany({
      where: { status: { not: "PENDING" } },
      select: {
        email: true,
        status: true,
        amountTotal: true,
        refundedAmount: true,
        shippingName: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const rows = new Map<string, CustomerRow>();
  for (const u of users) {
    const key = u.email.toLowerCase();
    rows.set(key, {
      id: u.id,
      name: u.name ?? u.email,
      email: u.email,
      hasAccount: true,
      orders: 0,
      spent: 0,
      since: u.createdAt,
      lastOrder: null,
    });
  }
  for (const o of orders) {
    const key = o.email.trim().toLowerCase();
    let row = rows.get(key);
    if (!row) {
      row = {
        id: guestCustomerId(key),
        name: o.shippingName ?? key,
        email: key,
        hasAccount: false,
        orders: 0,
        spent: 0,
        since: o.createdAt,
        lastOrder: null,
      };
      rows.set(key, row);
    }
    if (o.createdAt < row.since) row.since = o.createdAt;
    if (!row.lastOrder || o.createdAt > row.lastOrder) row.lastOrder = o.createdAt;
    const net = netPaid(o);
    if (net > 0) {
      row.orders += 1;
      row.spent += net;
    }
  }
  return [...rows.values()].sort(
    (a, b) =>
      (b.lastOrder ?? b.since).getTime() - (a.lastOrder ?? a.since).getTime(),
  );
}

export async function getCustomerDetail(id: string) {
  const guestEmail = emailFromGuestId(id);
  const u = guestEmail
    ? await prisma.user.findFirst({
        where: { email: { equals: guestEmail, mode: "insensitive" } },
      })
    : await prisma.user.findUnique({ where: { id } });
  if (!u && !guestEmail) return null;
  const email = (u?.email ?? guestEmail)!;

  const orders = await prisma.order.findMany({
    where: {
      OR: [
        ...(u ? [{ userId: u.id }] : []),
        { email: { equals: email, mode: "insensitive" as const } },
      ],
    },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  if (!u && orders.length === 0) return null;

  const real = orders.filter((o) => o.status !== "PENDING");
  const carts = orders.filter((o) => o.status === "PENDING");
  const paid = real.filter((o) => netPaid(o) > 0);
  const name =
    u?.name ?? real.find((o) => o.shippingName)?.shippingName ?? email;
  const first = orders[orders.length - 1]?.createdAt;
  const lastAddress = real.find((o) => o.shippingLine1);
  return {
    id,
    name,
    email,
    hasAccount: Boolean(u),
    phone: u?.phone ?? null,
    since: u?.createdAt ?? first ?? new Date(),
    spent: paid.reduce((s, o) => s + netPaid(o), 0),
    orderCount: paid.length,
    refundedCount: real.filter((o) => o.status === "REFUNDED").length,
    address: lastAddress
      ? {
          name: lastAddress.shippingName,
          line1: lastAddress.shippingLine1,
          zip: lastAddress.shippingZip,
          city: lastAddress.shippingCity,
          country: lastAddress.shippingCountry,
        }
      : null,
    orders: real.map((o) => ({
      id: o.id,
      reference: o.reference,
      date: o.createdAt,
      status: o.status,
      total: o.amountTotal,
      refunded: o.refundedAmount,
      items: o.items.map((it) => ({
        name: it.name,
        variant: it.variantLabel,
        quantity: it.quantity,
      })),
    })),
    abandonedCarts: carts.map((o) => ({
      id: o.id,
      reference: o.reference,
      date: o.createdAt,
      total: o.amountTotal,
    })),
  };
}

/* ============== PRODUITS (catalogue DB) ============== */

export interface AdminProductRow {
  id: string;
  slug: string;
  name: string;
  sku: string;
  seoTitle?: string;
  seoDescription?: string;
  price: number;
  category: string;
  categoryId: string;
  status: string;
  stock: number;
  inStock: boolean;
  image: { src: string; alt: string };
  images: { id: string; src: string; alt: string; variantId?: string }[];
  variants: {
    id: string;
    label: string;
    available: boolean;
    sku?: string;
    colorName?: string;
    sizeLabel?: string;
    stock?: number;
  }[];
  description: string;
  sourceUrl?: string;
}

export async function getAdminProducts(): Promise<AdminProductRow[]> {
  const rows = await prisma.product.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      variants: { orderBy: { sortOrder: "asc" } },
      details: { orderBy: { sortOrder: "asc" } },
    },
  });
  return rows.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    sku: p.sku,
    seoTitle: p.seoTitle ?? undefined,
    seoDescription: p.seoDescription ?? undefined,
    price: p.price,
    category: p.category.name,
    categoryId: p.categoryId,
    status: p.status,
    stock: p.stock,
    inStock: p.status === "active" && p.stock > 0,
    image: p.images[0] ?? { src: "", alt: p.name },
    images: p.images.map((im) => ({
      id: im.id,
      src: im.src,
      alt: im.alt,
      variantId: im.variantId ?? undefined,
    })),
    variants: p.variants.map((v) => ({
      id: v.id,
      label: v.label,
      available: v.available,
      sku: v.sku ?? undefined,
      colorName: v.colorName ?? undefined,
      sizeLabel: v.sizeLabel ?? undefined,
      stock: v.stock,
    })),
    description: p.description,
    sourceUrl: p.details.find((d) => d.label.toLowerCase() === "source")?.value,
  }));
}

export async function getAdminProduct(
  id: string,
): Promise<AdminProductRow | null> {
  const p = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { sortOrder: "asc" } },
      details: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!p) return null;
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    sku: p.sku,
    seoTitle: p.seoTitle ?? undefined,
    seoDescription: p.seoDescription ?? undefined,
    price: p.price,
    category: p.category.name,
    categoryId: p.categoryId,
    status: p.status,
    stock: p.stock,
    inStock: p.status === "active" && p.stock > 0,
    image: p.images[0] ?? { src: "", alt: p.name },
    images: p.images.map((im) => ({
      id: im.id,
      src: im.src,
      alt: im.alt,
      variantId: im.variantId ?? undefined,
    })),
    variants: p.variants.map((v) => ({
      id: v.id,
      label: v.label,
      available: v.available,
      sku: v.sku ?? undefined,
      colorName: v.colorName ?? undefined,
      sizeLabel: v.sizeLabel ?? undefined,
      stock: v.stock,
    })),
    description: p.description,
    sourceUrl: p.details.find((d) => d.label.toLowerCase() === "source")?.value,
  };
}

/** Catégories proposées dans la fiche produit (liste déroulante). */
export async function getAdminCategories() {
  return prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true },
  });
}

export function formatSince(date: Date): string {
  return date.toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
}
