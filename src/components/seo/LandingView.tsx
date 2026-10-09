import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { languageAlternates } from "@/lib/hreflang";
import { localizedPath, type Locale } from "@/lib/i18n";
import { getSeoLandingProducts } from "@/lib/seoLandingProducts";
import { landingConfig, type ContentPage } from "@/lib/pages";

/* Landing SEO servie depuis la base (Page kind = "landing"). */

async function currentLocale(): Promise<Locale> {
  const value = (await headers()).get("x-store-locale");
  return value === "en" || value === "he" ? value : "fr";
}

export async function landingMetadata(page: ContentPage): Promise<Metadata> {
  const locale = await currentLocale();
  const landing = landingConfig(page, locale);
  if (!landing) return {};
  const canonical = localizedPath(`/${landing.slug}`, locale);

  return {
    title: landing.title,
    description: landing.description,
    alternates: {
      canonical,
      languages: languageAlternates(`/${landing.slug}`),
    },
    openGraph: {
      title: landing.title,
      description: landing.description,
      url: canonical,
      type: "website",
    },
  };
}

export async function LandingView({ page }: { page: ContentPage }) {
  const locale = await currentLocale();
  const landing = landingConfig(page, locale);
  if (!landing) notFound();
  const products = await getSeoLandingProducts(landing, locale);

  return (
    <SeoLandingPage
      {...landing}
      canonical={localizedPath(`/${landing.slug}`, locale)}
      products={products}
      locale={locale}
    />
  );
}
