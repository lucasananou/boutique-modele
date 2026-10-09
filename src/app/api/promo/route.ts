import { NextResponse } from "next/server";
import { z } from "zod";
import { priceLines, applyPromo } from "@/lib/orders";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import type { Locale } from "@/lib/i18n";

/**
 * Vérifie un code promo AVANT le paiement, pour afficher la remise en direct
 * dans le récapitulatif. Le sous-total est recalculé depuis le catalogue : le
 * client n'envoie que ses lignes, jamais un montant.
 *
 * La remise définitive reste recalculée à la création du PaymentIntent — cette
 * route ne sert qu'à l'affichage.
 */

const schema = z.object({
  code: z.string().min(1).max(40),
  locale: z.enum(["fr", "en", "he"]).optional(),
  lines: z
    .array(
      z.object({
        productId: z.string(),
        slug: z.string(),
        variantId: z.string().optional(),
        quantity: z.number().int().min(1).max(10),
      }),
    )
    .min(1),
});

export async function POST(req: Request) {
  // Anti-énumération de codes : 12 essais / minute / IP.
  const ip = getClientIp(req.headers);
  const limit = rateLimit(`promo:${ip}`, { limit: 12, windowMs: 60_000 });
  if (!limit.ok) {
    return NextResponse.json(
      { valid: false, error: "Trop d'essais. Réessayez dans un instant." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ valid: false }, { status: 422 });
  }

  const locale: Locale = parsed.data.locale ?? "fr";
  // La devise doit suivre le sous-total : `priceLines` renvoie un montant DEJA
  // converti (USD, ILS). Sans elle, le minimum de commande etait compare a un
  // montant en shekels, et un code « des 120 EUR » se declenchait des 30 EUR.
  const { subtotal, currency } = await priceLines(parsed.data.lines, locale);
  const promo = await applyPromo(parsed.data.code, subtotal, currency);

  if (!promo) return NextResponse.json({ valid: false });

  return NextResponse.json({
    valid: true,
    code: promo.code,
    discount: promo.discount,
    detail: promo.detail,
  });
}
