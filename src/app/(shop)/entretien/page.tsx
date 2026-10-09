import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { PageHero } from "@/components/editorial/PageHero";
import { Prose } from "@/components/editorial/Prose";
import { localizedPath, type Locale } from "@/lib/i18n";
import { store } from "@/stores";

// Textes propres à la boutique : src/stores/<id>/pages/entretien.ts
const { copy } = store.pages.entretien;

async function currentLocale(): Promise<Locale> {
  const h = (await headers()).get("x-store-locale");
  return h === "en" || h === "he" ? h : "fr";
}

export async function generateMetadata(): Promise<Metadata> {
  const c = copy[await currentLocale()];
  return { title: c.title, description: c.description, alternates: { canonical: "/entretien" } };
}

export default async function EntretienPage() {
  const locale = await currentLocale();
  const c = copy[locale];
  return (
    <>
      <PageHero eyebrow={c.eyebrow} title={c.heroTitle} subtitle={c.subtitle} />
      <Prose>
        {c.sections.map(([title, body]) => (
          <section key={title}>
            <h2>{title}</h2>
            <p>{body}</p>
          </section>
        ))}
        <p>{c.contact} <Link href={localizedPath("/rendez-vous", locale)}>{c.link}</Link>.</p>
      </Prose>
    </>
  );
}
