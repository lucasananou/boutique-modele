"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { sendNewsletterWelcome, sendAppointmentRequest } from "@/lib/email";
import type { Locale } from "@/lib/i18n";

const emailSchema = z.string().email();

export async function subscribeNewsletter(
  email: string,
  locale: Locale = "fr",
): Promise<{ ok: boolean }> {
  const parsed = emailSchema.safeParse(email.trim());
  if (!parsed.success) return { ok: false };
  const address = parsed.data.toLowerCase();
  // Enregistre l'inscription (avant : seul l'e-mail de bienvenue partait, rien
  // n'était gardé). Déjà inscrite → pas de second e-mail de bienvenue.
  const existing = await prisma.newsletterSubscriber.findUnique({ where: { email: address } });
  if (existing && !existing.unsubscribedAt) return { ok: true };
  await prisma.newsletterSubscriber.upsert({
    where: { email: address },
    create: { email: address, locale },
    update: { locale, unsubscribedAt: null },
  });
  await sendNewsletterWelcome(address, locale);
  return { ok: true };
}

const appointmentSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  date: z.string().optional(),
  type: z.string().min(1),
  message: z.string().max(1000).optional(),
  locale: z.enum(["fr", "en", "he"]).optional(),
});

export async function requestAppointment(data: {
  name: string;
  email: string;
  phone?: string;
  date?: string;
  type: string;
  message?: string;
  locale?: Locale;
}): Promise<{ ok: boolean; error?: string }> {
  const parsed = appointmentSchema.safeParse(data);
  if (!parsed.success) {
    const locale = data.locale ?? "fr";
    return {
      ok: false,
      error:
        locale === "en"
          ? "Please check the form."
          : locale === "he"
            ? "אנא בדקי את הטופס."
            : "Merci de vérifier le formulaire.",
    };
  }
  await sendAppointmentRequest(parsed.data);
  return { ok: true };
}
