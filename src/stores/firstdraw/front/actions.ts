"use server";

import { z } from "zod";
import { hash } from "bcryptjs";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/db";
import { signIn, signOut } from "@/auth";
import { sendWelcome } from "@/lib/email";
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
    create: { email: parsed.data, locale: "en" },
  });
  return true;
}

/* ---------- Compte ---------- */

/** Retour après connexion : chemin interne uniquement (pas de redirection ouverte). */
function safeNext(value: FormDataEntryValue | null): string {
  const v = String(value ?? "");
  return /^\/(?!\/)[\w\-/?=&.]*$/.test(v) ? v : "/account";
}

export async function signInAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const ip = getClientIp(await headers());
  if (!rateLimit(`login:${ip}`, { limit: 8, windowMs: 60_000 }).ok) {
    return { error: "Too many attempts. Please wait a minute." };
  }
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? "").toLowerCase().trim(),
      password: String(formData.get("password") ?? ""),
      redirectTo: safeNext(formData.get("next")),
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) return { error: "Wrong email or password." };
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
    return { error: "Too many attempts. Please wait a minute." };
  }
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    if (field === "name") return { error: "Please enter your name." };
    if (field === "email") return { error: "Please enter a valid email." };
    return { error: "Your password needs at least 8 characters." };
  }
  const email = parsed.data.email.toLowerCase();
  // Adresses admin réservées : même message qu'un compte existant.
  const existing = isReservedAdminEmail(email) || (await prisma.user.findUnique({ where: { email } }));
  if (existing) return { error: "An account already exists with this email. Sign in instead." };

  await prisma.user.create({
    data: { name: parsed.data.name, email, passwordHash: await hash(parsed.data.password, 12) },
  });
  await sendWelcome(email, parsed.data.name, "en");
  await signIn("credentials", { email, password: parsed.data.password, redirectTo: "/account" });
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
    return { error: "Too many attempts. Please wait a minute." };
  }
  const token = String(formData.get("token") ?? "");
  const action = String(formData.get("action") ?? "");
  const sub = token ? await prisma.subscription.findUnique({ where: { manageToken: token } }) : null;
  if (!sub) return { error: "This link is no longer valid. Sign in to your account instead." };
  if (sub.status === "canceled") return { error: "This subscription has ended." };

  // Le rendu de la page (date, statut) suit l'action.
  const done = (r: ManageState) => {
    if (!r.error) revalidatePath("/", "layout");
    return r;
  };
  try {
    switch (action) {
      case "skip":
        await skipNextDelivery(sub);
        return done({ message: "Done. Your next delivery has moved back by one cycle." });
      case "reschedule": {
        const date = new Date(`${String(formData.get("date") ?? "")}T12:00:00Z`);
        const error = await rescheduleDelivery(sub, date);
        return error ? { error } : done({ message: "Done. Your next delivery date has changed." });
      }
      case "cancel":
        await cancelSubscription(sub);
        return done({ message: "Your subscription is cancelled. Nothing more will be charged after this cycle." });
      case "resume":
        await resumeSubscription(sub);
        return done({ message: "Welcome back. Your subscription continues as before." });
      case "portal": {
        const url = await billingPortalUrl(sub, `${await requestOrigin()}/account/subscription?token=${sub.manageToken}`);
        if (!url) return { error: "Card and invoice management opens with live payments." };
        return { message: url };
      }
      default:
        return { error: "Unknown action." };
    }
  } catch (e) {
    console.error("[abonnement] action impossible:", e);
    return { error: "We couldn't update your subscription. Please try again or email us." };
  }
}
