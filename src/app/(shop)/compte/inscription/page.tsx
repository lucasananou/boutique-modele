import type { Metadata } from "next";
import { headers } from "next/headers";
import { AuthForm } from "@/components/account/AuthForm";
import { t } from "@/lib/translations";
import type { Locale } from "@/lib/i18n";
import { registerUser } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const localeHeader = (await headers()).get("x-store-locale");
  const locale: Locale = localeHeader === "en" || localeHeader === "he" ? localeHeader : "fr";
  return { title: t(locale).account.registerMetaTitle };
}

export default function InscriptionPage() {
  return <AuthForm mode="register" action={registerUser} />;
}
