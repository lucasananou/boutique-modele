import type { Metadata } from "next";
import { headers } from "next/headers";
import { brand } from "@/lib/brand";
import { PageHero } from "@/components/editorial/PageHero";
import { ProductImage } from "@/components/ui/ProductImage";
import { ButtonLink } from "@/components/ui/Button";
import { galleryPool, homeImages } from "@/lib/images";
import { localizedPath, type Locale } from "@/lib/i18n";
import { store } from "@/stores";

// Textes propres à la boutique : src/stores/<id>/pages/laMaison.ts
const { copy } = store.pages.laMaison;

async function currentLocale(): Promise<Locale> {
  const h = (await headers()).get("x-store-locale");
  return h === "en" || h === "he" ? h : "fr";
}

export async function generateMetadata(): Promise<Metadata> {
  const c = copy[await currentLocale()];
  return { title: c.title, description: c.description, alternates: { canonical: "/la-maison" } };
}

export default async function LaMaisonPage() {
  const locale = await currentLocale();
  const c = copy[locale];
  return (
    <>
      <PageHero eyebrow={brand.tagline} title={c.heroTitle} subtitle={c.subtitle} />
      <section className="px-6 md:px-16 pb-16">
        <div className="relative h-[360px] md:h-[520px] rounded-md overflow-hidden bg-sand">
          <ProductImage src={galleryPool[0] ?? homeImages.hero} alt={c.heroTitle} sizes="100vw" />
        </div>
      </section>
      <section className="px-6 md:px-16 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div>
            <div className="eyebrow mb-5">{c.storyEyebrow}</div>
            <h2 className="font-serif font-normal text-[32px] md:text-[40px] leading-[1.1] text-ink mb-6">{c.storyTitle}</h2>
            <p className="font-sans text-[16px] leading-[1.85] text-warm-700 mb-4">{c.story1}</p>
            <p className="font-sans text-[16px] leading-[1.85] text-warm-700">{c.story2}</p>
          </div>
          <div className="relative h-[400px] md:h-[520px] rounded-md overflow-hidden bg-sand">
            <ProductImage src={galleryPool[1] ?? galleryPool[0] ?? homeImages.hero} alt={c.storyTitle} sizes="(max-width: 768px) 100vw, 50vw" />
          </div>
        </div>
      </section>
      <section id="atelier" className="bg-ink text-ink-soft px-6 md:px-16 py-20 md:py-24 scroll-mt-24">
        <div className="text-center mb-14">
          <div className="font-sans text-[11px] tracking-[0.28em] uppercase text-champagne-light mb-4">{c.processEyebrow}</div>
          <h2 className="font-serif font-normal text-[32px] md:text-[44px] text-ivory">{c.processTitle}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 max-w-[1100px] mx-auto">
          {c.steps.map(([n, title, body]) => <div key={n} className="lg:text-center"><div className="font-serif text-[28px] text-champagne-light mb-3">{n}</div><div className="font-serif text-[19px] text-ivory mb-2">{title}</div><p className="font-sans text-[13.5px] leading-[1.7] text-warm-300">{body}</p></div>)}
        </div>
      </section>
      <section id="engagements" className="px-6 md:px-16 py-20 md:py-24 scroll-mt-24">
        <div className="text-center mb-14"><div className="eyebrow mb-4">{c.commitmentsEyebrow}</div><h2 className="font-serif font-normal text-[32px] md:text-[44px] text-ink">{c.commitmentsTitle}</h2></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-[1100px] mx-auto">
          {c.commitments.map((commitment, i) => <div key={commitment} className="border-t border-ink/15 pt-5"><div className="font-serif text-[15px] text-champagne mb-2">{String(i + 1).padStart(2, "0")}</div><div className="font-serif text-[19px] text-ink">{commitment}</div></div>)}
        </div>
        <div className="text-center mt-14"><ButtonLink href={localizedPath("/boutique", locale)} variant="solid">{c.cta}</ButtonLink></div>
      </section>
    </>
  );
}
