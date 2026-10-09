import { Suspense } from "react";
import type { Metadata } from "next";
import { CategoryLayout } from "@/components/catalog/CategoryLayout";
import { CategoryStrip } from "@/components/catalog/CategoryStrip";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { filterCatalog, parseCatalogQuery, facetCounts } from "@/lib/catalog";
import { requestOrigin } from "@/lib/site";
import { getAllProducts } from "@/lib/products";
import { hasActiveFilterParams } from "@/lib/filterKeys";
import { getCategories, getMaterials, getCollections } from "@/lib/taxonomy";
import { JsonLd } from "@/components/seo/JsonLd";
import { itemListLd } from "@/lib/jsonld";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { headers } from "next/headers";
import { localizedPath, type Locale } from "@/lib/i18n";
import { languageAlternates } from "@/lib/hreflang";
import { t } from "@/lib/translations";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const filtered = hasActiveFilterParams(await searchParams);
  const localeHeader = (await headers()).get("x-store-locale");
  const locale: Locale = localeHeader === "en" || localeHeader === "he" ? localeHeader : "fr";
  const copy = t(locale).shopPage;
  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
    // URLs filtrées : canonical vers la page propre + noindex (anti-duplication).
    alternates: {
      canonical: localizedPath("/boutique", locale),
      languages: languageAlternates("/boutique"),
    },
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function BoutiquePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const localeHeader = (await headers()).get("x-store-locale");
  const locale: Locale = localeHeader === "en" || localeHeader === "he" ? localeHeader : "fr";
  // Origine de la requête : les données structurées doivent porter les URLs
  // du domaine réellement servi, pas celles figées au build.
  const origin = await requestOrigin();
  const query = parseCatalogQuery(sp);

  const [products, categories, materials, collections, allProducts] =
    await Promise.all([
      filterCatalog(query, locale),
      getCategories(locale),
      getMaterials(locale),
      getCollections(locale),
      getAllProducts(locale),
    ]);
  const copy = t(locale);
  const counts = facetCounts(allProducts);
  const quickFilters = [
    ...collections
      .filter((c) => (counts.collection[c.slug] ?? 0) > 0)
      .map((c) => ({
        id: `col-${c.slug}`,
        label: c.name,
        params: [["collection", c.slug]] as [string, string][],
      })),
    ...materials
      .filter((m) => (counts.matiere[m.slug] ?? 0) > 0)
      .map((m) => ({
        id: `mat-${m.slug}`,
        label: m.name,
        params: [["matiere", m.slug]] as [string, string][],
      })),
  ];

  return (
    <div className="px-6 md:px-16 py-8 md:py-10">
      <JsonLd data={itemListLd(products, origin)} />
      <div className="max-w-[1240px] mx-auto">
      <Breadcrumb items={[{ label: copy.common.home, href: localizedPath("/", locale) }, { label: copy.common.shop }]} />
      <header className="mt-8 md:mt-10 mb-11 md:mb-14">
        <div className="font-sans text-[12px] tracking-[0.22em] uppercase text-[#9b9488] mb-4">{copy.shopPage.eyebrow}</div>
        <h1 className="font-serif font-medium text-[40px] md:text-[62px] leading-[1.02] text-ink mb-5">
          {copy.shopPage.h1}
        </h1>
        <p className="font-sans text-[16px] leading-[1.7] text-[#5b554c] max-w-[560px]">
          {copy.shopPage.intro}
        </p>
      </header>

      {/* Accès direct aux catégories : sans cette rangée, elles n'existaient que
          dans la sidebar desktop ou derrière le bouton « Filtrer » sur mobile. */}
      <CategoryStrip categories={categories} counts={counts.categorie} locale={locale} />

      <Suspense fallback={<div className="h-32" />}>
        <CategoryLayout
          categories={categories}
          materials={materials}
          collections={collections}
          counts={counts}
          resultCount={products.length}
          shownCount={products.length}
          quickFilters={quickFilters}
          locale={locale}
        >
          <ProductGrid products={products} columns={3} resetHref="/boutique" locale={locale} />
        </CategoryLayout>
      </Suspense>
      </div>
    </div>
  );
}
