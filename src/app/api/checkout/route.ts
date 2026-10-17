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
  shippingFor,
} from "@/lib/orders";
import { auth } from "@/auth";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { localizedPath, type Locale } from "@/lib/i18n";
import { requestOrigin } from "@/lib/site";
import { validateShippingAddress } from "@/lib/address";
import { buildCheckoutSessionParams, buildCustomerParams } from "@/lib/stripeCheckout";
import { store } from "@/stores";

const schema = z.object({
  email: z.string().email(),
  locale: z.enum(["fr", "en", "he"]).optional(),
  giftWrap: z.boolean().optional(),
  promoCode: z.string().max(40).optional(),
  shipping: z.object({
    fullName: z.string().trim().min(2).max(120),
    line1: z.string().trim().min(3).max(200),
    line2: z.string().trim().max(200).optional(),
    zip: z.string().trim().min(3).max(20),
    city: z.string().trim().min(1).max(120),
    state: z.string().trim().max(40).optional(),
    country: z.string().trim().min(1).max(60),
    phone: z.string().trim().max(40).optional(),
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
        /** Abonnement : fréquence en jours (config.subscriptions.intervals). */
        intervalDays: z.number().int().min(1).max(365).optional(),
      }),
    )
    .min(1),
});

/** Messages d'erreur dans la langue de la vitrine. */
function msg(locale: Locale, fr: string, en: string) {
  return locale === "fr" ? fr : en;
}

export async function POST(req: Request) {
  // Anti-abus : ~10 initiations de paiement / minute / IP.
  const ip = getClientIp(req.headers);
  const limit = rateLimit(`checkout:${ip}`, { limit: 10, windowMs: 60_000 });
  const defaultLocale: Locale = store.front?.locale ?? "fr";
  if (!limit.ok) {
    return NextResponse.json(
      { error: msg(defaultLocale, "Trop de tentatives. Réessayez dans un instant.", "Too many attempts. Please try again in a moment.") },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: msg(defaultLocale, "Requête invalide", "Invalid request") }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path.at(-1) ?? "");
    return NextResponse.json(
      { error: msg(defaultLocale, "Champs manquants ou invalides", "Some fields are missing or invalid."), field },
      { status: 422 },
    );
  }

  const { email, giftWrap, promoCode, lines } = parsed.data;
  const locale: Locale = parsed.data.locale ?? defaultLocale;

  // Destination : pays livrés par la boutique (config.commerce.shipsTo).
  const address = validateShippingAddress(parsed.data.shipping);
  if (!address.ok) {
    return NextResponse.json({ error: address.error, field: address.field }, { status: 422 });
  }
  const shipping = address.address;

  // Abonnements : une seule ligne d'abonnement par commande (Stripe impose une
  // fréquence unique par abonnement).
  const subscriptionLines = lines.filter((l) => l.intervalDays !== undefined);
  if (subscriptionLines.length > 1) {
    return NextResponse.json(
      { error: msg(locale, "Un seul abonnement par commande.", "One subscription per order, please. Remove the other one from your bag.") },
      { status: 422 },
    );
  }

  // Prix recalculés serveur (jamais le client).
  const { items, subtotal, currency } = await priceLines(lines, locale);
  if (items.length === 0 || items.length !== lines.length) {
    return NextResponse.json(
      {
        error:
          items.length === 0
            ? msg(locale, "Aucune pièce disponible dans votre panier", "Nothing in your bag is available right now.")
            : msg(locale, "Un article de votre panier n'est plus disponible.", "One item in your bag is no longer available. Please refresh your bag."),
      },
      { status: 400 },
    );
  }

  // Promo validée serveur, puis frais de port.
  const promo = await applyPromo(promoCode, subtotal, currency);
  const discount = promo?.discount ?? 0;
  const shippingAmount = shippingFor(items, subtotal - discount, currency);
  const amountTotal = Math.max(0, subtotal - discount) + shippingAmount;
  const hasSubscription = items.some((i) => i.intervalDays);

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
      currency: currency.toLowerCase(),
      locale,
      kind: hasSubscription ? "subscription_start" : "one_time",
      giftWrap: Boolean(giftWrap),
      discountCode: promo?.code,
      discountAmount: discount,
      shippingAmount,
      confirmToken,
      status: "PENDING",
      shippingName: shipping.fullName,
      shippingLine1: shipping.line1,
      shippingLine2: shipping.line2 || null,
      shippingZip: shipping.zip,
      shippingCity: shipping.city,
      shippingState: shipping.state || null,
      shippingCountry: shipping.country,
      shippingPhone: shipping.phone || null,
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
          units: i.units,
          intervalDays: i.intervalDays,
        })),
      },
    },
  });

  // Retour sur le domaine depuis lequel la cliente paie.
  const base = await requestOrigin();
  const confirmPath = store.front?.paths.confirmation ?? localizedPath("/commande/confirmation", locale);
  const cancelPath = store.front?.paths.checkout ?? localizedPath("/commande", locale);
  const confirmUrl = `${base}${confirmPath}?ref=${order.reference}&token=${confirmToken}`;

  // ----- Stripe (clés de test ou live selon l'environnement) -----
  if (isStripeLive && stripe) {
    try {
      // Remise éventuelle via un coupon ponctuel (1re facture seulement).
      let couponId: string | undefined;
      if (discount > 0) {
        const coupon = await stripe.coupons.create({
          amount_off: discount,
          currency: currency.toLowerCase(),
          duration: "once",
          name: promo?.code ?? "Remise",
        });
        couponId = coupon.id;
      }

      // Client Stripe avec l'adresse : indispensable pour un abonnement
      // (renouvellements, portail client), utile pour un achat simple.
      const customer = await stripe.customers.create({
        ...buildCustomerParams(order.email, shipping),
        metadata: { reference: order.reference },
      });

      const checkout = await stripe.checkout.sessions.create(
        buildCheckoutSessionParams({
          items,
          currency,
          customerId: customer.id,
          email: order.email,
          reference: order.reference,
          orderId: order.id,
          shipping,
          shippingAmount,
          shippingLabel: store.commerce.shipping?.label ?? "Shipping",
          couponId,
          successUrl: `${confirmUrl}&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${base}${cancelPath}`,
          locale: locale === "fr" ? "fr" : locale === "he" ? "auto" : "en",
        }),
      );

      await prisma.order.update({
        where: { id: order.id },
        data: { stripeSessionId: checkout.id, stripeCustomerId: customer.id },
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
        { error: msg(locale, "Le paiement n'a pas pu être initié. Réessayez.", "We couldn't start the payment. Please try again.") },
        { status: 502 },
      );
    }
  }

  // ----- Mode démonstration (pas de clés Stripe) -----
  // On valide directement : statut PAID, stock décrémenté, abonnement créé,
  // e-mails journalisés.
  await markOrderPaid(order.id, { eventId: `demo-${order.id}`, locale });

  return NextResponse.json({ url: `${confirmUrl}&demo=1` });
}
