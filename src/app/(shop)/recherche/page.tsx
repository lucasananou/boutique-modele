import type { Metadata } from "next";
import { getAllProducts } from "@/lib/products";
import { getCategories } from "@/lib/taxonomy";
import { SearchClient } from "@/components/catalog/SearchClient";
import { headers } from "next/headers";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/translations";

export async function generateMetadata(): Promise<Metadata> {
  const localeHeader = (await headers()).get("x-store-locale");
  const locale: Locale = localeHeader === "en" || localeHeader === "he" ? localeHeader : "fr";
  return { title: t(locale).search.metaTitle };
}

export default async function SearchPage() {
  const localeHeader = (await headers()).get("x-store-locale");
  const locale: Locale = localeHeader === "en" || localeHeader === "he" ? localeHeader : "fr";
  const [products, categories] = await Promise.all([
    getAllProducts(locale),
    getCategories(locale),
  ]);
  return <SearchClient products={products} categories={categories} locale={locale} />;
}
