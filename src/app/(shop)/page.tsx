import type { Metadata } from "next";
import { headers } from "next/headers";
import { Hero } from "@/components/home/Hero";
import {
  Reassurance,
  Categories,
  FlashBestsellers,
  ValuesBand,
} from "@/components/home/sections";
import { CustomerReviews } from "@/components/home/CustomerReviews";
import { Faq } from "@/components/home/Faq";
import { getActiveFlashSale } from "@/lib/flashSale";
import { getAllProducts } from "@/lib/products";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqPageLd } from "@/lib/jsonld";
import { languageAlternates } from "@/lib/hreflang";
import { localizedPath, type Locale } from "@/lib/i18n";
import { t } from "@/lib/translations";
import { requestOrigin } from "@/lib/site";
import { store } from "@/stores";

export const revalidate = 60;

/** Locale résolue par le proxy et transmise en en-tête de requête. */
async function currentLocale(): Promise<Locale> {
  const header = (await headers()).get("x-store-locale");
  return header === "en" || header === "he" ? header : "fr";
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await currentLocale();
  const copy = t(locale).homePage;
  const origin = await requestOrigin();
  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
    alternates: {
      canonical: localizedPath("/", locale),
      languages: languageAlternates("/", origin),
    },
  };
}

export default async function Home() {
  const locale = await currentLocale();
  const copy = t(locale).homePage;

  const [flashSale, catalogue] = await Promise.all([
    getActiveFlashSale(),
    getAllProducts(locale),
  ]);

  // Pièce mise en avant : une nouveauté en stock et illustrée, à défaut la
  // première pièce disponible. Choisie en base et non codée en dur — le hero
  // ne doit jamais vendre une pièce épuisée ni rester figé sur un modèle.
  const vitrine =
    catalogue.find((p) => p.inStock && p.badge && p.images.length > 0) ??
    catalogue.find((p) => p.inStock && p.images.length > 0) ??
    null;

  return (
    <>
      {/* La FAQ balisée suit la langue servie : un extrait enrichi en anglais
          ne doit pas renvoyer des questions rédigées en français. */}
      {store.sections.homeFaq ? (
        <JsonLd data={[faqPageLd(copy.faq.items.map((f) => ({ q: f.q, a: f.a })))]} />
      ) : null}
      <Hero product={vitrine} salePercent={flashSale?.percent} locale={locale} />
      <Reassurance locale={locale} />
      <Categories locale={locale} />
      <FlashBestsellers flashSale={flashSale} locale={locale} />
      {store.sections.valuesBand ? <ValuesBand locale={locale} /> : null}
      <CustomerReviews locale={locale} />
      {store.sections.homeFaq ? <Faq locale={locale} /> : null}
    </>
  );
}
