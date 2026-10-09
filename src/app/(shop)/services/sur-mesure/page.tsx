import type { Metadata } from "next";
import { headers } from "next/headers";
import { PageHero } from "@/components/editorial/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { ProductImage } from "@/components/ui/ProductImage";
import { localizedPath, type Locale } from "@/lib/i18n";
import { store } from "@/stores";

// Textes propres à la boutique : src/stores/<id>/pages/surMesure.ts
const { copy } = store.pages.surMesure;

async function currentLocale(): Promise<Locale> {
  const h = (await headers()).get("x-store-locale");
  return h === "en" || h === "he" ? h : "fr";
}

export async function generateMetadata(): Promise<Metadata> {
  const c = copy[await currentLocale()];
  return { title: c.title, description: c.description, alternates: { canonical: "/services/sur-mesure" } };
}

export default async function SurMesurePage() {
  const locale = await currentLocale();
  const c = copy[locale];
  return (
    <>
      <PageHero eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle} />
      <section className="px-6 md:px-16 pb-16">
        <div className="relative h-[320px] md:h-[480px] rounded-md overflow-hidden">
          <ProductImage src="" alt={c.imageAlt} sizes="100vw" />
        </div>
      </section>
      <section className="px-6 md:px-16 pb-20 max-w-[1100px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {c.steps.map(([n, title, body]) => (
            <div key={n} className="border-t border-ink/15 pt-5">
              <div className="font-serif text-[26px] text-champagne mb-3">{n}</div>
              <div className="font-serif text-[20px] text-ink mb-2">{title}</div>
              <p className="font-sans text-[14px] leading-[1.75] text-warm-700">{body}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-14"><ButtonLink href={localizedPath("/rendez-vous", locale)} variant="solid">{c.cta}</ButtonLink></div>
      </section>
    </>
  );
}
