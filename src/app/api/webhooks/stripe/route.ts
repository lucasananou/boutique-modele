import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { markOrderPaid } from "@/lib/orders";

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
      await markOrderPaid(order.id, {
        eventId: event.id,
        paymentIntent:
          typeof s.payment_intent === "string" ? s.payment_intent : undefined,
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
