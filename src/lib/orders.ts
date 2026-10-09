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
}

/**
 * Recalcule les prix CÔTÉ SERVEUR depuis la base (jamais le client).
 * Valide aussi le stock et le libellé de variante.
 */
export async function priceLines(lines: IncomingLine[], locale: Locale = "fr"): Promise<{
  items: PricedLine[];
  subtotal: number;
  currency: Currency;
}> {
  // Le catalogue est en centimes d'euro ; on convertit AVANT de sommer, pour
  // que le total encaisse corresponde exactement aux lignes affichees.
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

    const qty = Math.max(1, Math.min(10, Math.floor(line.quantity || 1)));
    const unitPrice = convertFromEur(variantPrice(product, variant?.id), currency);
    items.push({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      variantId: variant?.id,
      variantLabel: variant?.label,
      engraving: line.engraving?.slice(0, 30),
      unitPrice,
      quantity: qty,
    });
  }
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  return { items, subtotal, currency };
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

/**
 * Marque une commande comme payée — IDEMPOTENT.
 * Passe à PAID, décrémente le stock une seule fois (garde `stockApplied`),
 * envoie la confirmation client + la notification admin. Sûr à rejouer
 * (webhook livré plusieurs fois) grâce aux gardes de statut.
 */
export async function markOrderPaid(
  orderId: string,
  opts: { eventId?: string; paymentIntent?: string; locale?: Locale } = {},
): Promise<void> {
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

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "PAID",
      stockApplied: true,
      lastStripeEvent: opts.eventId ?? order.lastStripeEvent,
      stripePaymentIntent: opts.paymentIntent ?? order.stripePaymentIntent,
    },
  });

  // E-mails (no-op si Resend non configuré).
  const payload = {
    reference: order.reference,
    email: order.email,
    amountTotal: order.amountTotal,
    currency: order.currency,
    discountAmount: order.discountAmount,
    giftWrap: order.giftWrap,
    shippingName: order.shippingName,
    locale: opts.locale ?? (order.locale as Locale),
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
