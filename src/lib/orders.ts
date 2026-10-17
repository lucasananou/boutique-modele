import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { getProductBySlug } from "@/lib/products";
import { variantPrice } from "@/lib/productUtils";
import { sendOrderConfirmation, sendAdminNewOrder } from "@/lib/email";
import type { Locale } from "@/lib/i18n";
import { convertFromEur, currencyFor, type Currency } from "@/lib/currency";
import { store } from "@/stores";

export interface IncomingLine {
  productId: string;
  slug: string;
  variantId?: string;
  variantLabel?: string;
  engraving?: string;
  quantity: number;
  /** Ligne d'abonnement : fréquence en jours (doit figurer dans config.subscriptions.intervals). */
  intervalDays?: number;
}

export interface PricedLine {
  productId: string;
  slug: string;
  name: string;
  variantId?: string;
  variantLabel?: string;
  engraving?: string;
  unitPrice: number;
  quantity: number;
  /** Unités physiques par article (pack de 2 pots = 2). */
  units: number;
  /** Abonnement : fréquence en jours ; absent = achat simple. */
  intervalDays?: number;
}

/** Prix d'abonnement : prix simple diminué de la remise configurée, arrondi au centime. */
export function subscriptionPrice(oneTimePrice: number): number {
  const pct = store.subscriptions?.discountPercent ?? 0;
  return Math.round((oneTimePrice * (100 - pct)) / 100);
}

/** Fréquence d'abonnement acceptée par la boutique ? */
export function isAllowedInterval(days: number | undefined): days is number {
  return typeof days === "number" && Boolean(store.subscriptions?.intervals.includes(days));
}

/**
 * Recalcule les prix CÔTÉ SERVEUR depuis la base (jamais le client).
 * Valide aussi le stock et le libellé de variante. Une ligne d'abonnement
 * (intervalDays) n'est acceptée que si la boutique propose cette fréquence.
 */
export async function priceLines(lines: IncomingLine[], locale: Locale = "fr"): Promise<{
  items: PricedLine[];
  subtotal: number;
  currency: Currency;
}> {
  // Le catalogue est dans la devise de la boutique (euro par défaut) ; on
  // convertit AVANT de sommer, pour que le total encaissé corresponde
  // exactement aux lignes affichées.
  const currency = currencyFor(locale);
  const items: PricedLine[] = [];
  for (const line of lines) {
    const product = await getProductBySlug(line.slug, locale);
    if (!product || product.id !== line.productId || !product.inStock) continue;

    // Valide la variante contre le catalogue.
    const variant = line.variantId
      ? product.variants.find((v) => v.id === line.variantId && v.available)
      : undefined;
    if (line.variantId && !variant) continue;
    if (variant?.stock !== undefined && variant.stock > 0 && variant.stock < line.quantity) {
      continue;
    }
    if (line.intervalDays !== undefined && !isAllowedInterval(line.intervalDays)) continue;

    const qty = Math.max(1, Math.min(10, Math.floor(line.quantity || 1)));
    const base = variantPrice(product, variant?.id);
    const unitPrice = convertFromEur(
      line.intervalDays !== undefined ? subscriptionPrice(base) : base,
      currency,
    );
    items.push({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      variantId: variant?.id,
      variantLabel: variant?.label,
      engraving: line.engraving?.slice(0, 30),
      unitPrice,
      quantity: qty,
      units: Math.max(1, variant?.units ?? 1),
      intervalDays: line.intervalDays,
    });
  }
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  return { items, subtotal, currency };
}

/**
 * Frais de port d'une commande (unités mineures de `currency`) selon
 * config.commerce.shipping : offerts si la commande contient un abonnement
 * (config.subscriptions.freeShipping) ou dépasse le seuil de gratuité.
 */
export function shippingFor(items: PricedLine[], amountAfterDiscount: number, currency: Currency): number {
  const rule = store.commerce.shipping;
  if (!rule || items.length === 0) return 0;
  if (store.subscriptions?.freeShipping && items.some((i) => i.intervalDays)) return 0;
  if (rule.freeOver !== null && amountAfterDiscount >= convertFromEur(rule.freeOver, currency)) return 0;
  return convertFromEur(rule.flatRate, currency);
}

export interface PromoResult {
  code: string;
  discount: number;
  detail: string;
}

/** Valide un code promo et calcule la remise (en centimes). */
export async function applyPromo(
  code: string | undefined,
  subtotal: number,
  currency: Currency = "EUR",
): Promise<PromoResult | null> {
  if (!code) return null;
  const promo = await prisma.promotion.findUnique({
    where: { code: code.trim().toUpperCase() },
  });
  if (!promo || !promo.active) return null;
  if (promo.expiresAt && promo.expiresAt.getTime() < Date.now()) return null;
  if (subtotal < convertFromEur(promo.minSubtotal, currency)) return null;

  const discount =
    promo.kind === "percent"
      ? Math.round((subtotal * promo.value) / 100)
      : Math.min(convertFromEur(promo.value, currency), subtotal);

  return { code: promo.code, discount, detail: promo.detail };
}

export interface MarkPaidOptions {
  eventId?: string;
  paymentIntent?: string;
  locale?: Locale;
  /** Abonnement Stripe créé par le paiement (Checkout en mode subscription). */
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  /** Prochaine échéance connue (Stripe) ; à défaut : maintenant + fréquence. */
  nextChargeAt?: Date;
}

/**
 * Marque une commande comme payée — IDEMPOTENT.
 * Passe à PAID, décrémente le stock une seule fois (garde `stockApplied`),
 * crée l'abonnement si la commande en démarre un, envoie la confirmation
 * client + la notification admin. Sûr à rejouer (webhook livré plusieurs
 * fois) grâce aux gardes de statut.
 */
export async function markOrderPaid(orderId: string, opts: MarkPaidOptions = {}): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return;

  // Déjà traité (même event ou déjà payé + stock appliqué) → no-op.
  if (order.lastStripeEvent && order.lastStripeEvent === opts.eventId) return;
  const alreadyPaid = order.status !== "PENDING" && order.stockApplied;
  if (alreadyPaid) return;

  // Décrément de stock une seule fois.
  if (!order.stockApplied) {
    for (const it of order.items) {
      if (it.variantId) {
        await prisma.productVariant.updateMany({
          where: { id: it.variantId },
          data: { stock: { decrement: it.quantity } },
        });
      } else {
        await prisma.product.updateMany({
          where: { slug: it.slug },
          data: { stock: { decrement: it.quantity } },
        });
      }
    }
  }

  // Abonnement démarré par cette commande (une ligne d'abonnement par commande).
  let subscriptionId = order.subscriptionId;
  let manageToken: string | null = null;
  const subLine = order.items.find((i) => i.intervalDays);
  if (subLine?.intervalDays && !subscriptionId) {
    const existing = opts.stripeSubscriptionId
      ? await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: opts.stripeSubscriptionId },
        })
      : null;
    const sub =
      existing ??
      (await prisma.subscription.create({
        data: {
          userId: order.userId,
          email: order.email,
          status: "active",
          productId: subLine.productId,
          slug: subLine.slug,
          name: subLine.name,
          variantId: subLine.variantId,
          variantLabel: subLine.variantLabel,
          units: subLine.units,
          quantity: subLine.quantity,
          intervalDays: subLine.intervalDays,
          unitAmount: subLine.unitPrice * subLine.quantity,
          currency: order.currency,
          locale: order.locale,
          stripeSubscriptionId: opts.stripeSubscriptionId,
          stripeCustomerId: opts.stripeCustomerId ?? order.stripeCustomerId,
          nextChargeAt:
            opts.nextChargeAt ?? new Date(Date.now() + subLine.intervalDays * 86_400_000),
          manageToken: randomUUID(),
          shippingName: order.shippingName,
          shippingLine1: order.shippingLine1,
          shippingLine2: order.shippingLine2,
          shippingCity: order.shippingCity,
          shippingState: order.shippingState,
          shippingZip: order.shippingZip,
          shippingCountry: order.shippingCountry,
          shippingPhone: order.shippingPhone,
        },
      }));
    subscriptionId = sub.id;
    manageToken = sub.manageToken;
  } else if (subscriptionId) {
    manageToken =
      (await prisma.subscription.findUnique({ where: { id: subscriptionId } }))?.manageToken ?? null;
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "PAID",
      stockApplied: true,
      lastStripeEvent: opts.eventId ?? order.lastStripeEvent,
      stripePaymentIntent: opts.paymentIntent ?? order.stripePaymentIntent,
      stripeCustomerId: opts.stripeCustomerId ?? order.stripeCustomerId,
      subscriptionId,
    },
  });

  // E-mails (journalisés si Resend non configuré).
  const payload = {
    reference: order.reference,
    email: order.email,
    amountTotal: order.amountTotal,
    currency: order.currency,
    discountAmount: order.discountAmount,
    shippingAmount: order.shippingAmount,
    giftWrap: order.giftWrap,
    shippingName: order.shippingName,
    locale: opts.locale ?? (order.locale as Locale),
    kind: order.kind,
    manageToken,
    items: order.items,
  };
  await sendOrderConfirmation(payload);
  await sendAdminNewOrder(payload);
}

/**
 * Génère une référence lisible ATOMIQUE : <PRÉFIXE>-<ANNÉE>-0001 (préfixe de
 * la config boutique, ex. « CMD »). Compteur transactionnel par
 * année (pas de course concurrente) — l'année n'est plus figée à 2026.
 */
export async function nextOrderReference(): Promise<string> {
  const year = new Date().getFullYear();
  const counter = await prisma.counter.upsert({
    where: { id: `orders-${year}` },
    update: { value: { increment: 1 } },
    create: { id: `orders-${year}`, value: 1 },
  });
  return `${store.orders.prefix}-${year}-${String(counter.value).padStart(4, "0")}`;
}
