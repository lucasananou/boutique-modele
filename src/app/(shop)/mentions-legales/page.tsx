import type { Metadata } from "next";
import { headers } from "next/headers";
import { PageHero } from "@/components/editorial/PageHero";
import { Prose } from "@/components/editorial/Prose";
import { FrenchOnlyNotice, MentionsLegalesText } from "@/components/legal/legalText";
import type { Locale } from "@/lib/i18n";

// Texte légal généré depuis la config de la boutique (vendeur, hébergeur…).
const titles: Record<Locale, string> = {
  fr: "Mentions légales",
  en: "Legal notice",
  he: "מידע משפטי",
};
const eyebrow: Record<Locale, string> = {
  fr: "Informations légales",
  en: "Legal information",
  he: "מידע משפטי",
};

async function currentLocale(): Promise<Locale> {
  const h = (await headers()).get("x-store-locale");
  return h === "en" || h === "he" ? h : "fr";
}

export async function generateMetadata(): Promise<Metadata> {
  return { title: titles[await currentLocale()], robots: { index: false } };
}

export default async function LegalPage() {
  const locale = await currentLocale();
  return (
    <>
      <PageHero eyebrow={eyebrow[locale]} title={titles[locale]} />
      <Prose>
        <FrenchOnlyNotice locale={locale} />
        <MentionsLegalesText locale={locale} />
      </Prose>
    </>
  );
}
