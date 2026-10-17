import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { stripe, isStripeLive } from "@/lib/stripe";
import { nextOrderReference } from "@/lib/orders";
import { sendOrderConfirmation, sendAdminNewOrder } from "@/lib/email";
import type { Locale } from "@/lib/i18n";
import { randomUUID } from "crypto";

/*
 * Abonnements : Stripe Billing fait foi pour la facturation (mode réel) ; la
 * table Subscription reflète son état pour le compte cliente et l'admin. Sans
 * clé Stripe (mode démo), les actions modifient seulement la base.
 *
 * Décaler ou sauter une livraison = repousser la prochaine facturation : chez
 * Stripe, on pose `trial_end` à la nouvelle date (méthode documentée pour
 * déplacer une échéance, aucune proration, aucun prélèvement d'ici là).
 */

const DAY = 86_400_000;

export type SubscriptionRow = NonNullable<Awaited<ReturnType<typeof prisma.subscription.findUnique>>>;

/** Statut Stripe → statut affiché. `trialing` = échéance décalée, donc active. */
export function mapStripeStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "paused":
      return "paused";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return "incomplete";
  }
}

/**
 * Prochaine échéance d'un abonnement Stripe. Depuis l'API 2025 « basil », la
 * période courante est portée par les lignes (`items.data[].current_period_end`) ;
 * une échéance décalée est dans `trial_end`.
 */
export function stripeNextCharge(sub: Stripe.Subscription): Date | null {
  if (sub.status === "trialing" && sub.trial_end) return new Date(sub.trial_end * 1000);
  const legacy = (sub as unknown as { current_period_end?: number }).current_period_end;
  const fromItem = sub.items?.data?.[0]?.current_period_end;
  const ts = fromItem ?? legacy;
  return ts ? new Date(ts * 1000) : null;
}

/** Recopie l'état Stripe dans la base (webhooks customer.subscription.*). */
export async function syncFromStripe(sub: Stripe.Subscription): Promise<void> {
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: sub.id },
    data: {
      status: mapStripeStatus(sub.status),
      nextChargeAt: stripeNextCharge(sub),
      cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
      canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
    },
  });
}

async function applyNewDate(sub: SubscriptionRow, date: Date): Promise<void> {
  if (isStripeLive && stripe && sub.stripeSubscriptionId) {
    const updated = await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      trial_end: Math.floor(date.getTime() / 1000),
      proration_behavior: "none",
    });
    await syncFromStripe(updated);
    return;
  }
  await prisma.subscription.update({ where: { id: sub.id }, data: { nextChargeAt: date } });
}

/** Saute la prochaine livraison : l'échéance recule d'une fréquence. */
export async function skipNextDelivery(sub: SubscriptionRow): Promise<void> {
  const from = sub.nextChargeAt ?? new Date();
  await applyNewDate(sub, new Date(from.getTime() + sub.intervalDays * DAY));
}

/**
 * Déplace la prochaine livraison à une date donnée : entre demain et
 * 180 jours, pour éviter une échéance immédiate ou un abonnement « gelé ».
 */
export async function rescheduleDelivery(sub: SubscriptionRow, date: Date): Promise<string | null> {
  const min = Date.now() + DAY;
  const max = Date.now() + 180 * DAY;
  if (Number.isNaN(date.getTime()) || date.getTime() < min || date.getTime() > max) {
    return "Pick a date between tomorrow and 6 months from now.";
  }
  await applyNewDate(sub, date);
  return null;
}

/** Résilie en fin de période (la livraison déjà payée part quand même). */
export async function cancelSubscription(sub: SubscriptionRow): Promise<void> {
  if (isStripeLive && stripe && sub.stripeSubscriptionId) {
    const updated = await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
    await syncFromStripe(updated);
    return;
  }
  await prisma.subscription.update({
    where: { id: sub.id },
    data: { cancelAtPeriodEnd: true },
  });
}

/** Annule une résiliation programmée. */
export async function resumeSubscription(sub: SubscriptionRow): Promise<void> {
  if (isStripeLive && stripe && sub.stripeSubscriptionId) {
    const updated = await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });
    await syncFromStripe(updated);
    return;
  }
  await prisma.subscription.update({
    where: { id: sub.id },
    data: { cancelAtPeriodEnd: false },
  });
}

/**
 * Portail client Stripe (carte bancaire, factures). Null en mode démo ou si
 * l'abonnement n'a pas de client Stripe. Le portail doit être activé une fois
 * dans le tableau de bord Stripe (Settings → Billing → Customer portal).
 */
export async function billingPortalUrl(sub: SubscriptionRow, returnUrl: string): Promise<string | null> {
  if (!isStripeLive || !stripe || !sub.stripeCustomerId) return null;
  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: returnUrl,
  });
  return session.url;
}

/**
 * Commande de renouvellement (facture d'abonnement payée) : nouvelle commande
 * PAID, à transmettre au fournisseur comme une autre. Idempotent par facture.
 */
export async function createRenewalOrder(
  sub: SubscriptionRow,
  opts: { invoiceId: string; amountPaid: number; eventId?: string; nextChargeAt?: Date | null },
): Promise<string | null> {
  const existing = await prisma.order.findUnique({ where: { stripeInvoiceId: opts.invoiceId } });
  if (existing) return existing.id;

  const unitPrice = Math.round(sub.unitAmount / Math.max(1, sub.quantity));
  const order = await prisma.order.create({
    data: {
      reference: await nextOrderReference(),
      email: sub.email,
      userId: sub.userId,
      status: "PAID",
      kind: "subscription_renewal",
      amountTotal: opts.amountPaid,
      currency: sub.currency,
      locale: sub.locale,
      confirmToken: randomUUID(),
      stockApplied: true,
      lastStripeEvent: opts.eventId,
      stripeInvoiceId: opts.invoiceId,
      stripeCustomerId: sub.stripeCustomerId,
      subscriptionId: sub.id,
      shippingName: sub.shippingName,
      shippingLine1: sub.shippingLine1,
      shippingLine2: sub.shippingLine2,
      shippingCity: sub.shippingCity,
      shippingState: sub.shippingState,
      shippingZip: sub.shippingZip,
      shippingCountry: sub.shippingCountry,
      shippingPhone: sub.shippingPhone,
      items: {
        create: [
          {
            productId: sub.productId,
            slug: sub.slug,
            name: sub.name,
            variantId: sub.variantId,
            variantLabel: sub.variantLabel,
            unitPrice,
            quantity: sub.quantity,
            units: sub.units,
            intervalDays: sub.intervalDays,
          },
        ],
      },
    },
    include: { items: true },
  });

  if (sub.variantId) {
    await prisma.productVariant.updateMany({
      where: { id: sub.variantId },
      data: { stock: { decrement: sub.quantity } },
    });
  }
  await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      status: "active",
      nextChargeAt: opts.nextChargeAt ?? new Date(Date.now() + sub.intervalDays * DAY),
    },
  });

  const payload = {
    reference: order.reference,
    email: order.email,
    amountTotal: order.amountTotal,
    currency: order.currency,
    shippingName: order.shippingName,
    locale: order.locale as Locale,
    kind: order.kind,
    manageToken: sub.manageToken,
    items: order.items,
  };
  await sendOrderConfirmation(payload);
  await sendAdminNewOrder(payload);
  return order.id;
}
