import { auth } from "@/auth";
import { isAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { sendCartReminder, type ReminderStep } from "@/lib/email";
import type { Locale } from "@/lib/i18n";
import { store } from "@/stores";

/**
 * Relance des paniers abandonnés (= commandes PENDING non payées).
 *
 * Cadence :
 *   • Relance 1 : ≥ 1 h après abandon (sans remise)
 *   • Relance 2 : ≥ 24 h après la relance 1 (sans remise)
 *   • Relance 3 : ≥ 72 h après la relance 2 (avec code promo −10 %)
 *
 * Un panier n'est plus relancé s'il est payé/annulé, « récupéré » (le même
 * e-mail a une commande PAID/SHIPPED/DELIVERED créée après), ou trop vieux
 * (> 14 j). Idempotent : sûr à rejouer souvent (les gardes reminderCount /
 * lastReminderAt empêchent les doublons).
 *
 * Protégé comme /api/live/cleanup : session admin OU header x-cron-secret ==
 * CART_RELANCE_SECRET.
 */

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** Code promo garanti pour l'étape 3. */
const PROMO_CODE = store.promos.cartRecoveryCode;

async function ensurePromo(): Promise<string> {
  await prisma.promotion.upsert({
    where: { code: PROMO_CODE },
    update: { active: true },
    create: {
      code: PROMO_CODE,
      kind: "percent",
      value: store.promos.cartRecoveryPercent,
      minSubtotal: 0,
      detail: `Votre panier vous attend — ${store.promos.cartRecoveryPercent} % offerts`,
      active: true,
    },
  });
  return PROMO_CODE;
}

export async function POST(req: Request) {
  // Auth : secret cron dans le header, sinon session admin.
  const cronSecret = req.headers.get("x-cron-secret");
  const validCron =
    Boolean(cronSecret) && cronSecret === process.env.CART_RELANCE_SECRET;

  if (!validCron) {
    const session = await auth();
    if (!(await isAdminSession(session))) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const now = Date.now();
  const oldestCreated = new Date(now - 14 * DAY);
  const graceCutoff = new Date(now - 1 * HOUR);

  // Candidats : PENDING, abandonnés depuis ≥ 1 h et ≤ 14 j.
  const candidates = await prisma.order.findMany({
    where: {
      status: "PENDING",
      createdAt: { gte: oldestCreated, lte: graceCutoff },
    },
    include: { items: true },
    orderBy: { createdAt: "asc" },
  });

  // Emails « récupérés » : une commande payée/expédiée/livrée existe pour le
  // même e-mail, créée APRÈS la commande abandonnée. On charge en une requête
  // toutes les commandes « gagnantes » des e-mails candidats, puis on compare.
  const emails = [...new Set(candidates.map((o) => o.email))];
  const wins = emails.length
    ? await prisma.order.findMany({
        where: {
          email: { in: emails },
          status: { in: ["PAID", "SHIPPED", "DELIVERED"] },
        },
        select: { email: true, createdAt: true },
      })
    : [];
  // Date de la 1re « récupération » par e-mail.
  const recoveredAt = new Map<string, number>();
  for (const w of wins) {
    const t = w.createdAt.getTime();
    const cur = recoveredAt.get(w.email);
    if (cur === undefined || t < cur) recoveredAt.set(w.email, t);
  }

  function isRecovered(email: string, abandonedAt: Date): boolean {
    const t = recoveredAt.get(email);
    return t !== undefined && t > abandonedAt.getTime();
  }

  /** Détermine l'étape de relance due, ou null si aucune. */
  function dueStep(o: {
    reminderCount: number;
    createdAt: Date;
    lastReminderAt: Date | null;
  }): ReminderStep | null {
    const age = now - o.createdAt.getTime();
    const sinceLast = o.lastReminderAt
      ? now - o.lastReminderAt.getTime()
      : Infinity;
    if (o.reminderCount === 0 && age >= 1 * HOUR) return 1;
    if (o.reminderCount === 1 && sinceLast >= 24 * HOUR) return 2;
    if (o.reminderCount === 2 && sinceLast >= 72 * HOUR) return 3;
    return null;
  }

  const byStep: Record<ReminderStep, number> = { 1: 0, 2: 0, 3: 0 };
  let sent = 0;
  let promoCode: string | undefined;

  for (const order of candidates) {
    if (isRecovered(order.email, order.createdAt)) continue;
    const step = dueStep(order);
    if (!step) continue;

    // À l'étape 3 : garantir le code promo une seule fois (à la demande).
    if (step === 3 && !promoCode) {
      promoCode = await ensurePromo();
    }

    const delivered = await sendCartReminder(
      {
        reference: order.reference,
        email: order.email,
        amountTotal: order.amountTotal,
        discountAmount: order.discountAmount,
        giftWrap: order.giftWrap,
        shippingName: order.shippingName,
        confirmToken: order.confirmToken,
        locale: order.locale as Locale,
        items: order.items,
        promoCode: step === 3 ? promoCode : undefined,
      },
      step,
    );
    // E-mail non parti → on ne compte pas la relance (elle sera retentée).
    if (!delivered) continue;

    await prisma.order.update({
      where: { id: order.id },
      data: { reminderCount: { increment: 1 }, lastReminderAt: new Date() },
    });

    byStep[step] += 1;
    sent += 1;
  }

  return Response.json({ sent, byStep });
}
