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
import { localizedPath, type Locale } from "@/lib/i18n";

const schema = z.object({
  email: z.string().email(),
  locale: z.enum(["fr", "en", "he"]).optional(),
  giftWrap: z.boolean().optional(),
  promoCode: z.string().max(40).optional(),
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
  // Anti-abus : ~10 initiations de paiement / minute / IP.
  const ip = getClientIp(req.headers);
  const limit = rateLimit(`checkout:${ip}`, { limit: 10, windowMs: 60_000 });
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

  const { email, giftWrap, promoCode, shipping, lines } = parsed.data;
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
  const reference = await nextOrderReference();
  const confirmToken = randomUUID();

  // Commande créée en PENDING.
  const order = await prisma.order.create({
    data: {
      reference,
      email: email.toLowerCase().trim(),
      userId: session?.user?.id,
      amountTotal,
      currency: "eur",
      locale,
      giftWrap: Boolean(giftWrap),
      discountCode: promo?.code,
      discountAmount: discount,
      confirmToken,
      status: "PENDING",
      shippingName: shipping.fullName,
      shippingLine1: shipping.line1,
      shippingZip: shipping.zip,
      shippingCity: shipping.city,
      shippingCountry: shipping.country,
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

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const confirmUrl = `${base}${localizedPath("/commande/confirmation", locale)}?ref=${order.reference}&token=${confirmToken}`;

  // ----- Stripe réel -----
  if (isStripeLive && stripe) {
    try {
      // Remise éventuelle via un coupon ponctuel.
      let discounts: { coupon: string }[] | undefined;
      if (discount > 0) {
        const coupon = await stripe.coupons.create({
          amount_off: discount,
          currency: "eur",
          duration: "once",
          name: promo?.code ?? "Remise",
        });
        discounts = [{ coupon: coupon.id }];
      }

      const checkout = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: order.email,
        line_items: items.map((i) => ({
          quantity: i.quantity,
          price_data: {
            currency: "eur",
            unit_amount: i.unitPrice,
            product_data: {
              name: i.name + (i.variantLabel ? ` — ${i.variantLabel}` : ""),
            },
          },
        })),
        ...(discounts ? { discounts } : {}),
        success_url: `${confirmUrl}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${base}${localizedPath("/commande", locale)}`,
        metadata: { reference: order.reference },
      });

      await prisma.order.update({
        where: { id: order.id },
        data: { stripeSessionId: checkout.id },
      });

      return NextResponse.json({ url: checkout.url });
    } catch (e) {
      console.error("[checkout] Stripe a échoué:", e);
      // Nettoyage : on annule la commande orpheline.
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED" },
      });
      return NextResponse.json(
        { error: "Le paiement n'a pas pu être initié. Réessayez." },
        { status: 502 },
      );
    }
  }

  // ----- Mode démonstration (pas de clés Stripe) -----
  // On valide directement : statut PAID, stock décrémenté, e-mails envoyés.
  await markOrderPaid(order.id, { eventId: `demo-${order.id}`, locale });

  return NextResponse.json({ url: `${confirmUrl}&demo=1` });
}
