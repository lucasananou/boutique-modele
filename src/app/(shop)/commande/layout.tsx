import type { Metadata } from "next";
import { headers } from "next/headers";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/translations";

export async function generateMetadata(): Promise<Metadata> {
  const localeHeader = (await headers()).get("x-store-locale");
  const locale: Locale = localeHeader === "en" || localeHeader === "he" ? localeHeader : "fr";
  const copy = t(locale).checkout;
  return {
    title: copy.title,
    robots: { index: false, follow: true },
  };
}

export default function CommandeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
