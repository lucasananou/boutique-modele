import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { stripe, isStripeLive } from "@/lib/stripe";
import {
  priceLines,
  applyPromo,
  nextOrderReference,
  markOrderPaid,
} from "@/lib/orders";
import { auth } from "@/auth";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { requestOrigin } from "@/lib/site";
import { localizedPath, type Locale } from "@/lib/i18n";

/**
 * Encaissement SUR LE SITE (Stripe Payment Element).
 *
 * Contrairement à /api/checkout (Checkout Session hébergée par Stripe), cette
 * route ne redirige pas : elle prépare la commande et renvoie le `clientSecret`
 * d'un PaymentIntent que le navigateur confirme dans la page.
 *
 * Elle est RE-JOUABLE : si le panier ou le code promo change pendant que la
 * cliente est à l'étape paiement, le client renvoie `orderId` et on met à jour
 * la commande PENDING + le montant du PaymentIntent existant, au lieu de semer
 * des commandes orphelines à chaque modification.
 */

const schema = z.object({
  email: z.string().email(),
  locale: z.enum(["fr", "en", "he"]).optional(),
  giftWrap: z.boolean().optional(),
  promoCode: z.string().max(40).optional(),
  /** Commande PENDING déjà ouverte pour ce tunnel (mise à jour au lieu de création). */
  orderId: z.string().optional(),
  shipping: z.object({
    fullName: z.string().min(2),
    line1: z.string().min(3),
    zip: z.string().min(3),
    city: z.string().min(1),
    country: z.string().min(1),
    phone: z.string().optional(),
  }),
  lines: z
    .array(
      z.object({
        productId: z.string(),
        slug: z.string(),
        variantId: z.string().optional(),
        variantLabel: z.string().optional(),
        engraving: z.string().max(30).optional(),
        quantity: z.number().int().min(1).max(10),
      }),
    )
    .min(1),
});

export async function POST(req: Request) {
  // Anti-abus : ~15 préparations de paiement / minute / IP (le tunnel peut en
  // légitimement enchaîner plusieurs si la cliente ajuste son panier).
  const ip = getClientIp(req.headers);
  const limit = rateLimit(`payment-intent:${ip}`, { limit: 15, windowMs: 60_000 });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans un instant." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Champs manquants ou invalides" },
      { status: 422 },
    );
  }

  const { email, giftWrap, promoCode, shipping, lines, orderId } = parsed.data;
  const locale: Locale = parsed.data.locale ?? "fr";

  // Prix recalculés serveur (jamais le client).
  const { items, subtotal, currency } = await priceLines(lines, locale);
  if (items.length === 0) {
    return NextResponse.json(
      { error: "Aucune pièce disponible dans votre panier" },
      { status: 400 },
    );
  }

  // Promo validée serveur.
  const promo = await applyPromo(promoCode, subtotal, currency);
  const discount = promo?.discount ?? 0;
  const amountTotal = Math.max(0, subtotal - discount);

  const session = await auth();

  const orderData = {
    email: email.toLowerCase().trim(),
    userId: session?.user?.id,
    amountTotal,
    // Devise REELLEMENT facturee : les montants de la commande sont exprimes
    // dans ses unites mineures, plus en centimes d'euro.
    currency: currency.toLowerCase(),
    locale,
    giftWrap: Boolean(giftWrap),
    discountCode: promo?.code,
    discountAmount: discount,
    shippingName: shipping.fullName,
    shippingLine1: shipping.line1,
    shippingZip: shipping.zip,
    shippingCity: shipping.city,
    shippingCountry: shipping.country,
  };

  // Reprise d'une commande PENDING du même tunnel, sinon création.
  const existing = orderId
    ? await prisma.order.findFirst({ where: { id: orderId, status: "PENDING" } })
    : null;

  const order = existing
    ? await prisma.order.update({
        where: { id: existing.id },
        data: {
          ...orderData,
          items: {
            deleteMany: {},
            create: items.map((i) => ({
              productId: i.productId,
              slug: i.slug,
              name: i.name,
              variantId: i.variantId,
              variantLabel: i.variantLabel,
              engraving: i.engraving,
              unitPrice: i.unitPrice,
              quantity: i.quantity,
            })),
          },
        },
      })
    : await prisma.order.create({
        data: {
          ...orderData,
          reference: await nextOrderReference(),
          confirmToken: randomUUID(),
          status: "PENDING",
          items: {
            create: items.map((i) => ({
              productId: i.productId,
              slug: i.slug,
              name: i.name,
              variantId: i.variantId,
              variantLabel: i.variantLabel,
              engraving: i.engraving,
              unitPrice: i.unitPrice,
              quantity: i.quantity,
            })),
          },
        },
      });

  // Retour sur le domaine DEPUIS LEQUEL la cliente paie : une constante de
  // build la renverrait sur l'autre domaine après paiement, avec perte de
  // session et de panier en plein tunnel.
  const base = await requestOrigin();
  const returnUrl = `${base}${localizedPath("/commande/confirmation", locale)}?ref=${order.reference}&token=${order.confirmToken}`;

  const summary = {
    orderId: order.id,
    reference: order.reference,
    subtotal,
    discount,
    amountTotal,
    promoCode: promo?.code ?? null,
    promoDetail: promo?.detail ?? null,
    returnUrl,
  };

  // ----- Mode démonstration (pas de clés Stripe) -----
  // On valide directement : statut PAID, stock décrémenté, e-mails envoyés.
  if (!isStripeLive || !stripe) {
    await markOrderPaid(order.id, { eventId: `demo-${order.id}`, locale });
    return NextResponse.json({ ...summary, demo: true, redirectUrl: `${returnUrl}&demo=1` });
  }

  try {
    // Réutilise le PaymentIntent de la commande si elle est déjà ouverte : la
    // cliente garde sa saisie de carte quand elle ajuste son panier.
    let intent = order.stripePaymentIntent
      ? await stripe.paymentIntents.retrieve(order.stripePaymentIntent).catch(() => null)
      : null;

    // La devise d'un PaymentIntent ne se change pas en cours de route : si la
    // cliente a changé de langue pendant le tunnel, on en recrée un.
    const reusable =
      intent &&
      intent.currency === currency.toLowerCase() &&
      ["requires_payment_method", "requires_confirmation", "requires_action"].includes(
        intent.status,
      );

    if (intent && reusable) {
      if (intent.amount !== amountTotal) {
        intent = await stripe.paymentIntents.update(intent.id, { amount: amountTotal });
      }
    } else {
      intent = await stripe.paymentIntents.create({
        amount: amountTotal,
        currency: currency.toLowerCase(),
        // Active CB, Apple Pay, Google Pay et Link selon la configuration du
        // dashboard Stripe, sans les lister ici à la main.
        automatic_payment_methods: { enabled: true },
        receipt_email: order.email,
        description: `Commande ${order.reference}`,
        metadata: { reference: order.reference, orderId: order.id },
        shipping: {
          name: shipping.fullName,
          phone: shipping.phone,
          address: {
            line1: shipping.line1,
            postal_code: shipping.zip,
            city: shipping.city,
            country: shipping.country,
          },
        },
      });
      await prisma.order.update({
        where: { id: order.id },
        data: { stripePaymentIntent: intent.id },
      });
    }

    return NextResponse.json({ ...summary, clientSecret: intent.client_secret });
  } catch (e) {
    console.error("[payment-intent] Stripe a échoué:", e);
    // La commande reste PENDING : elle sera reprise si la cliente réessaie.
    return NextResponse.json(
      { error: "Le paiement n'a pas pu être initié. Réessayez." },
      { status: 502 },
    );
  }
}
