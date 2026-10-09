"use server";

import { z } from "zod";
import { hash } from "bcryptjs";
import { headers } from "next/headers";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/db";
import { signIn, signOut } from "@/auth";
import { sendWelcome } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { isReservedAdminEmail } from "@/lib/roles";
import { localizedPath, type Locale } from "@/lib/i18n";
import { t } from "@/lib/translations";

export interface FormState {
  error?: string;
}

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z
    .string()
    .min(8),
});

function formLocale(formData: FormData): Locale {
  const locale = formData.get("locale");
  return locale === "en" || locale === "he" ? locale : "fr";
}

export async function registerUser(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  const locale = formLocale(formData);
  const copy = t(locale).account;

  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    if (field === "name") return { error: copy.invalidName };
    if (field === "email") return { error: copy.invalidEmail };
    if (field === "password") return { error: copy.invalidPassword };
    return { error: copy.invalidFields };
  }

  const email = parsed.data.email.toLowerCase().trim();

  // Les adresses d'administration (ADMIN_EMAILS) ne peuvent pas être prises
  // par l'inscription publique : sinon, sur une boutique neuve, n'importe qui
  // créerait le compte admin avant le propriétaire. Message identique à celui
  // d'un compte existant (pas d'indice sur les adresses admin).
  const existing = isReservedAdminEmail(email)
    ? true
    : await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: copy.existingAccount };
  }

  const passwordHash = await hash(parsed.data.password, 12);
  await prisma.user.create({
    data: { name: parsed.data.name.trim(), email, passwordHash },
  });

  // E-mail de bienvenue (no-op si Resend non configuré).
  await sendWelcome(email, parsed.data.name.trim(), locale);

  // Connexion automatique puis redirection (signIn lève la redirection).
  await signIn("credentials", {
    email,
    password: parsed.data.password,
    redirectTo: localizedPath("/compte", locale),
  });

  return {};
}

export async function authenticate(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  // Anti-brute force : ~8 tentatives de connexion / minute / IP.
  const ip = getClientIp(await headers());
  const locale = formLocale(formData);
  const copy = t(locale).account;
  if (!rateLimit(`login:${ip}`, { limit: 8, windowMs: 60_000 }).ok) {
    return {
      error: copy.tooManyAttempts,
    };
  }

  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? "").toLowerCase().trim(),
      password: String(formData.get("password") ?? ""),
      redirectTo: localizedPath("/compte", locale),
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: copy.invalidCredentials };
    }
    // Laisse passer la redirection NextAuth.
    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}
