import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { priceLines } from "@/lib/orders";
import { auth } from "@/auth";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { sendCartLeadWelcome } from "@/lib/email";
import type { Locale } from "@/lib/i18n";
import { store } from "@/stores";

/** Code de réduction délivré à la capture (réutilisé par la relance étape 3). */
const LEAD_PROMO = store.promos.cartRecoveryCode;

const schema = z.object({
  email: z.string().email(),
  locale: z.enum(["fr", "en", "he"]).optional(),
  giftWrap: z.boolean().optional(),
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

/**
 * Capture d'e-mail au panier (visiteur anonyme qui ne va pas jusqu'au checkout).
 * Crée un panier « lead » en PENDING (sans adresse) → réutilise TOUT le système
 * de relance existant (cron + /panier/reprendre + dashboard). Envoie aussitôt un
 * e-mail avec le code −10 %. Déduplique par e-mail (met à jour le panier existant).
 */
export async function POST(req: Request) {
  const ip = getClientIp(req.headers);
  const limit = rateLimit(`cartlead:${ip}`, { limit: 5, windowMs: 60_000 });
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
    return NextResponse.json({ error: "E-mail ou panier invalide" }, { status: 422 });
  }

  const { email, giftWrap, lines } = parsed.data;
  const locale: Locale = parsed.data.locale ?? "fr";
  const cleanEmail = email.toLowerCase().trim();

  // Prix recalculés serveur (jamais le client).
  const { items, subtotal, currency } = await priceLines(lines, locale);
  if (items.length === 0) {
    return NextResponse.json({ error: "Votre panier est vide" }, { status: 400 });
  }

  // Garantit l'existence du code −10 % (idempotent, comme la relance étape 3).
  await prisma.promotion.upsert({
    where: { code: LEAD_PROMO },
    update: { active: true },
    create: {
      code: LEAD_PROMO,
      kind: "percent",
      value: store.promos.cartRecoveryPercent,
      minSubtotal: 0,
      detail: `Votre panier vous attend — ${store.promos.cartRecoveryPercent} % offerts`,
      active: true,
    },
  });

  const session = await auth();
  const itemCreate = items.map((i) => ({
    productId: i.productId,
    slug: i.slug,
    name: i.name,
    variantId: i.variantId,
    variantLabel: i.variantLabel,
    engraving: i.engraving,
    unitPrice: i.unitPrice,
    quantity: i.quantity,
  }));

  // Déduplication : un panier lead PENDING existe déjà pour cet e-mail → mise à jour.
  const existing = await prisma.order.findFirst({
    where: { email: cleanEmail, status: "PENDING", source: "cart_lead" },
    orderBy: { createdAt: "desc" },
  });

  const order = existing
    ? await prisma.order.update({
        where: { id: existing.id },
        data: {
          amountTotal: subtotal,
          locale,
          giftWrap: Boolean(giftWrap),
          reminderCount: 1,
          lastReminderAt: new Date(),
          userId: session?.user?.id ?? existing.userId,
          items: { deleteMany: {}, create: itemCreate },
        },
      })
    : await prisma.order.create({
        data: {
          reference: `PAN-${randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`,
          email: cleanEmail,
          userId: session?.user?.id,
          amountTotal: subtotal,
          currency: currency.toLowerCase(),
          locale,
          giftWrap: Boolean(giftWrap),
          confirmToken: randomUUID(),
          status: "PENDING",
          source: "cart_lead",
          // On considère l'e-mail de capture comme la 1re relance → le cron
          // enchaîne sur les paliers 24h / 72h.
          reminderCount: 1,
          lastReminderAt: new Date(),
          items: { create: itemCreate },
        },
      });

  // E-mail immédiat : code + lien de reprise (no-op si Resend non configuré).
  await sendCartLeadWelcome(
    {
      reference: order.reference,
      email: order.email,
      amountTotal: order.amountTotal,
      confirmToken: order.confirmToken,
      locale,
      items,
    },
    LEAD_PROMO,
  );

  return NextResponse.json({ ok: true, code: LEAD_PROMO });
}
