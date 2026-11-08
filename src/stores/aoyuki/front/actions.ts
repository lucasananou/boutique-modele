"use server";

import { z } from "zod";
import { hash } from "bcryptjs";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/db";
import { signIn, signOut } from "@/auth";
import { sendReturnRequest, sendWelcome } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { isReservedAdminEmail } from "@/lib/roles";
import { requestOrigin } from "@/lib/site";
import {
  billingPortalUrl,
  cancelSubscription,
  rescheduleDelivery,
  resumeSubscription,
  skipNextDelivery,
} from "@/lib/subscriptions";

export interface FormState {
  error?: string;
}

/* ---------- Newsletter ---------- */

export async function subscribeNewsletter(email: string): Promise<boolean> {
  const ip = getClientIp(await headers());
  if (!rateLimit(`newsletter:${ip}`, { limit: 5, windowMs: 60_000 }).ok) return false;
  const parsed = z.string().email().max(200).safeParse(email.trim().toLowerCase());
  if (!parsed.success) return false;
  await prisma.newsletterSubscriber.upsert({
    where: { email: parsed.data },
    update: { unsubscribedAt: null },
    create: { email: parsed.data, locale: "fr" },
  });
  return true;
}

/* ---------- Rétractation et retours ---------- */

const retourSchema = z.object({
  type: z.enum(["Rétractation", "Retour"]),
  email: z.string().trim().email().max(200),
  reference: z.string().trim().max(40).optional(),
  message: z.string().trim().max(2000).optional(),
});

export async function demandeRetour(data: unknown): Promise<{ ok: boolean; error?: string }> {
  const ip = getClientIp(await headers());
  if (!rateLimit(`retour:${ip}`, { limit: 5, windowMs: 60_000 }).ok) {
    return { ok: false, error: "Trop de tentatives, réessayez dans une minute." };
  }
  const parsed = retourSchema.safeParse(data);
  if (!parsed.success) return { ok: false, error: "Indiquez une adresse e-mail valide." };
  await sendReturnRequest(parsed.data);
  return { ok: true };
}

/* ---------- Compte ---------- */

/** Retour après connexion : chemin interne uniquement (pas de redirection ouverte). */
function safeNext(value: FormDataEntryValue | null): string {
  const v = String(value ?? "");
  return /^\/(?!\/)[\w\-/?=&.]*$/.test(v) ? v : "/compte";
}

export async function signInAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const ip = getClientIp(await headers());
  if (!rateLimit(`login:${ip}`, { limit: 8, windowMs: 60_000 }).ok) {
    return { error: "Trop de tentatives. Patientez une minute." };
  }
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? "").toLowerCase().trim(),
      password: String(formData.get("password") ?? ""),
      redirectTo: safeNext(formData.get("next")),
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) return { error: "E-mail ou mot de passe incorrect." };
    throw error; // redirection Auth.js
  }
}

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(200),
  password: z.string().min(8).max(200),
});

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const ip = getClientIp(await headers());
  if (!rateLimit(`register:${ip}`, { limit: 5, windowMs: 60_000 }).ok) {
    return { error: "Trop de tentatives. Patientez une minute." };
  }
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    if (field === "name") return { error: "Indiquez votre nom." };
    if (field === "email") return { error: "Indiquez une adresse e-mail valide." };
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  }
  const email = parsed.data.email.toLowerCase();
  // Adresses admin réservées : même message qu'un compte existant.
  const existing = isReservedAdminEmail(email) || (await prisma.user.findUnique({ where: { email } }));
  if (existing) return { error: "Un compte existe déjà avec cet e-mail. Connectez-vous." };

  await prisma.user.create({
    data: { name: parsed.data.name, email, passwordHash: await hash(parsed.data.password, 12) },
  });
  await sendWelcome(email, parsed.data.name, "fr");
  await signIn("credentials", { email, password: parsed.data.password, redirectTo: "/compte" });
  return {};
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

/* ---------- Abonnement (lien sans compte ou compte propriétaire) ---------- */

export interface ManageState {
  error?: string;
  message?: string;
}

export async function manageSubscriptionAction(_prev: ManageState, formData: FormData): Promise<ManageState> {
  const ip = getClientIp(await headers());
  if (!rateLimit(`sub-manage:${ip}`, { limit: 20, windowMs: 60_000 }).ok) {
    return { error: "Trop de tentatives. Patientez une minute." };
  }
  const token = String(formData.get("token") ?? "");
  const action = String(formData.get("action") ?? "");
  const sub = token ? await prisma.subscription.findUnique({ where: { manageToken: token } }) : null;
  if (!sub) return { error: "Ce lien n’est plus valable. Connectez-vous à votre compte." };
  if (sub.status === "canceled") return { error: "Cet abonnement est terminé." };

  const done = (r: ManageState) => {
    if (!r.error) revalidatePath("/", "layout");
    return r;
  };
  try {
    switch (action) {
      case "skip":
        await skipNextDelivery(sub);
        return done({ message: "C’est fait : votre prochaine livraison est décalée d’un cycle." });
      case "reschedule": {
        const date = new Date(`${String(formData.get("date") ?? "")}T12:00:00Z`);
        const error = await rescheduleDelivery(sub, date);
        return error ? { error } : done({ message: "C’est fait : la date de livraison a changé." });
      }
      case "cancel":
        await cancelSubscription(sub);
        return done({ message: "Votre abonnement est résilié. Rien ne sera prélevé après ce cycle." });
      case "resume":
        await resumeSubscription(sub);
        return done({ message: "Votre abonnement continue comme avant." });
      case "portal": {
        const url = await billingPortalUrl(sub, `${await requestOrigin()}/compte/abonnement?token=${sub.manageToken}`);
        if (!url) return { error: "La gestion de la carte ouvrira avec le paiement réel." };
        return { message: url };
      }
      default:
        return { error: "Action inconnue." };
    }
  } catch (e) {
    console.error("[abonnement] action impossible:", e);
    return { error: "Impossible de modifier votre abonnement. Réessayez ou écrivez-nous." };
  }
}
