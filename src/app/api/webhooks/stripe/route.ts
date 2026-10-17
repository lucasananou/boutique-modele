import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { markOrderPaid } from "@/lib/orders";
import { createRenewalOrder, stripeNextCharge, syncFromStripe } from "@/lib/subscriptions";
import { sendRenewalReminder } from "@/lib/email";
import type { Locale } from "@/lib/i18n";

/** Abonnement d'une facture (API ≥ 2025 « basil » : `parent.subscription_details`). */
function invoiceSubscriptionId(inv: Stripe.Invoice): string | null {
  const fromParent = inv.parent?.subscription_details?.subscription;
  const legacy = (inv as unknown as { subscription?: string | { id: string } | null }).subscription;
  const ref = fromParent ?? legacy;
  if (!ref) return null;
  return typeof ref === "string" ? ref : ref.id;
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  // Stripe non configuré → no-op (mode démo).
  if (!stripe || !secret || secret.includes("xxx")) {
    return NextResponse.json({ received: true, mode: "demo" });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Signature absente" }, { status: 400 });
  }

  const payload = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      // Vérifie que le paiement est bien abouti.
      if (s.payment_status !== "paid") break;
      const order = await prisma.order.findUnique({
        where: { stripeSessionId: s.id },
      });
      if (!order) break;
      // Garde-fou : le montant payé doit correspondre à la commande.
      if (typeof s.amount_total === "number" && s.amount_total !== order.amountTotal) {
        console.error(
          `[webhook] montant divergent pour ${order.reference}: ${s.amount_total} ≠ ${order.amountTotal}`,
        );
        break;
      }
      // Abonnement créé par la session (mode subscription).
      const subscriptionId =
        typeof s.subscription === "string" ? s.subscription : s.subscription?.id;
      let nextChargeAt: Date | undefined;
      if (subscriptionId) {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        nextChargeAt = stripeNextCharge(sub) ?? undefined;
      }
      await markOrderPaid(order.id, {
        eventId: event.id,
        paymentIntent:
          typeof s.payment_intent === "string" ? s.payment_intent : undefined,
        stripeSubscriptionId: subscriptionId,
        stripeCustomerId: typeof s.customer === "string" ? s.customer : s.customer?.id,
        nextChargeAt,
      });
      break;
    }

    // Encaissement dans la page (Payment Element) : c'est le PaymentIntent qui
    // fait foi, il n'y a pas de Checkout Session.
    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;
      const order = await prisma.order.findFirst({
        where: { stripePaymentIntent: pi.id },
      });
      if (!order) break;
      // Garde-fou : le montant encaissé doit correspondre à la commande.
      if (pi.amount_received !== order.amountTotal) {
        console.error(
          `[webhook] montant divergent pour ${order.reference}: ${pi.amount_received} ≠ ${order.amountTotal}`,
        );
        break;
      }
      await markOrderPaid(order.id, { eventId: event.id, paymentIntent: pi.id });
      break;
    }

    case "checkout.session.expired": {
      const s = event.data.object as Stripe.Checkout.Session;
      await prisma.order.updateMany({
        where: { stripeSessionId: s.id, status: "PENDING" },
        data: { status: "CANCELLED" },
      });
      break;
    }

    // Renouvellement d'abonnement payé → nouvelle commande à expédier. La
    // première facture (subscription_create) est couverte par la session.
    case "invoice.paid": {
      const inv = event.data.object as Stripe.Invoice;
      if (inv.billing_reason !== "subscription_cycle") break;
      const subId = invoiceSubscriptionId(inv);
      if (!subId || !inv.id) break;
      const sub = await prisma.subscription.findUnique({ where: { stripeSubscriptionId: subId } });
      if (!sub) break;
      const stripeSub = await stripe.subscriptions.retrieve(subId);
      await createRenewalOrder(sub, {
        invoiceId: inv.id,
        amountPaid: inv.amount_paid,
        eventId: event.id,
        nextChargeAt: stripeNextCharge(stripeSub),
      });
      break;
    }

    // Rappel avant renouvellement (envoyé par Stripe X jours avant, réglage
    // Billing → Subscriptions → « Upcoming renewal events »).
    case "invoice.upcoming": {
      const inv = event.data.object as Stripe.Invoice;
      const subId = invoiceSubscriptionId(inv);
      if (!subId) break;
      const sub = await prisma.subscription.findUnique({ where: { stripeSubscriptionId: subId } });
      if (!sub || sub.cancelAtPeriodEnd || sub.status === "canceled") break;
      await sendRenewalReminder({
        email: sub.email,
        name: sub.shippingName,
        productName: sub.name,
        variantLabel: sub.variantLabel,
        amount: inv.amount_due,
        currency: sub.currency,
        date: inv.next_payment_attempt ? new Date(inv.next_payment_attempt * 1000) : sub.nextChargeAt,
        manageToken: sub.manageToken,
        locale: sub.locale as Locale,
      });
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      await syncFromStripe(event.data.object as Stripe.Subscription);
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      const pi =
        typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : undefined;
      if (pi) {
        // Remboursement total → REFUNDED ; partiel → statut conservé, seul le
        // montant remboursé est enregistré (déduit du « total dépensé »).
        await prisma.order.updateMany({
          where: { stripePaymentIntent: pi },
          data: {
            refundedAmount: charge.amount_refunded,
            ...(charge.refunded ? { status: "REFUNDED" as const } : {}),
          },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
