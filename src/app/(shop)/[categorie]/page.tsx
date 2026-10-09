import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getCategory,
  getCategories,
  getMaterials,
  getCollections,
} from "@/lib/taxonomy";
import { filterCatalog, parseCatalogQuery, facetCounts } from "@/lib/catalog";
import { requestOrigin } from "@/lib/site";
import { getProductsByCategory } from "@/lib/products";
import { hasActiveFilterParams } from "@/lib/filterKeys";
import { breadcrumbLd, faqPageLd, itemListLd } from "@/lib/jsonld";
import { categoryFromSegment } from "@/lib/categories";
import { getPage } from "@/lib/pages";
import { store } from "@/stores";
import { ArticleLayout, articleMetadata } from "@/components/editorial/ArticleLayout";
import { LandingView, landingMetadata } from "@/components/seo/LandingView";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { CategoryLayout } from "@/components/catalog/CategoryLayout";
import { CategoryStrip } from "@/components/catalog/CategoryStrip";
import { Pagination } from "@/components/catalog/Pagination";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { JsonLd } from "@/components/seo/JsonLd";
import { headers } from "next/headers";
import { localizedPath, type Locale } from "@/lib/i18n";
import { languageAlternates } from "@/lib/hreflang";
import { t } from "@/lib/translations";

export const revalidate = 60;

/*
 * Route racine /<segment> : catégorie (Category.urlSlug), article du journal ou
 * landing SEO (table Page). Tout est en base, propre à chaque boutique ; un
 * segment inconnu → 404. Les routes statiques (/boutique, /journal…) restent
 * prioritaires.
 */
async function resolveSegment(segment: string) {
  const slug = await categoryFromSegment(segment);
  if (slug) return { type: "category" as const, slug };
  const page = await getPage(segment);
  if (page?.kind === "article") return { type: "article" as const, page };
  if (page?.kind === "landing") return { type: "landing" as const, page };
  return null;
}

/** Nombre de produits par page (4 rangées × 3 colonnes). */
const PAGE_SIZE = 12;

/**
 * Lit `?page=N` et le clampe dans [1, totalPages].
 * Valeur absente / non numérique / hors bornes → page 1.
 */
function resolvePage(
  raw: string | string[] | undefined,
  totalPages: number,
): number {
  const first = Array.isArray(raw) ? raw[0] : raw;
  const n = Number.parseInt(first ?? "", 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, Math.max(totalPages, 1));
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ categorie: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const [{ categorie }, sp] = await Promise.all([params, searchParams]);
  const route = await resolveSegment(categorie);
  if (!route) return {};
  if (route.type === "article") return articleMetadata(route.page);
  if (route.type === "landing") return landingMetadata(route.page);
  const slug = route.slug;
  const localeHeader = (await headers()).get("x-store-locale");
  const locale: Locale = localeHeader === "en" || localeHeader === "he" ? localeHeader : "fr";
  const cat = await getCategory(slug, locale);
  if (!cat) return {};
  const filtered = hasActiveFilterParams(sp);
  // Pages filtrées OU au-delà de la page 1 → noindex (anti-duplication),
  // mais on suit les liens (follow) pour propager le crawl.
  const pageParam = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const beyondFirstPage = Number.parseInt(pageParam ?? "1", 10) > 1;
  const titleSuffix = store.catalog.categoryTitleSuffix[locale];
  return {
    title: titleSuffix ? `${cat.seoTitle} — ${titleSuffix}` : cat.seoTitle,
    description: cat.description,
    alternates: {
      canonical: localizedPath(`/${categorie}`, locale),
      languages: languageAlternates(`/${categorie}`),
    },
    robots:
      filtered || beyondFirstPage ? { index: false, follow: true } : undefined,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ categorie: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ categorie }, sp] = await Promise.all([params, searchParams]);
  const route = await resolveSegment(categorie);
  if (!route) notFound();
  if (route.type === "article") return <ArticleLayout page={route.page} />;
  if (route.type === "landing") return <LandingView page={route.page} />;
  const slug = route.slug;

  const localeHeader = (await headers()).get("x-store-locale");
  const locale: Locale = localeHeader === "en" || localeHeader === "he" ? localeHeader : "fr";
  // Origine de la requête : les données structurées doivent porter les URLs
  // du domaine réellement servi, pas celles figées au build.
  const origin = await requestOrigin();
  const copy = t(locale);
  const cat = await getCategory(slug, locale);
  if (!cat) notFound();

  // La catégorie vient de la route → toujours appliquée, jamais surchargeable.
  const query = { ...parseCatalogQuery(sp), categorie: slug };

  const [products, categories, materials, collections, catProducts] =
    await Promise.all([
      filterCatalog(query, locale),
      getCategories(locale),
      getMaterials(locale),
      getCollections(locale),
      getProductsByCategory(slug, locale),
    ]);
  const counts = facetCounts(catProducts);
  const faqs = cat.faqs;
  const seoCopy = cat.seoText;
  const h1 = cat.seoTitle;

  // Pagination côté serveur : on pagine le RÉSULTAT filtré/trié (le filtrage
  // lui-même reste inchangé). On ne rend que la tranche de la page courante.
  const totalCount = products.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const page = resolvePage(sp.page, totalPages);
  const pageProducts = products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const shownCount = Math.min(page * PAGE_SIZE, totalCount);

  // Chips « filtres rapides » construits sur les DONNÉES RÉELLES de la catégorie :
  // collections présentes (compte > 0), puis matières présentes. Chaque chip
  // câble un vrai paramètre d'URL (collection= / matiere=).
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

  // Eyebrow hero : « Collection · <saison de la collection phare de la catégorie> ».
  const leadCollection = collections.find(
    (c) => (counts.collection[c.slug] ?? 0) > 0,
  );
  const eyebrow = leadCollection?.season
    ? `Collection · ${leadCollection.season}`
    : locale === "en"
      ? "Collection · All year"
      : locale === "he"
        ? "קולקציה · כל השנה"
        : "Collection · Toute l'année";

  return (
    <div className="px-6 md:px-16 py-8 md:py-10">
      <JsonLd
        data={[
          breadcrumbLd([
            { name: copy.common.home, path: localizedPath("/", locale) },
            { name: copy.common.shop, path: "/boutique" },
            { name: cat.name, path: `/${categorie}` },
          ], origin),
          itemListLd(products, origin),
          ...(faqs.length ? [faqPageLd(faqs)] : []),
        ]}
      />

      <div className="max-w-[1240px] mx-auto">
        {/* 1 · Fil d'ariane */}
        <Breadcrumb
          items={[
            { label: copy.common.home, href: localizedPath("/", locale) },
            { label: cat.name },
          ]}
        />

        {/* 2 · Hero */}
        <header className="mt-8 md:mt-10 mb-11 md:mb-14">
          <div>
            <div className="font-sans text-[12px] tracking-[0.22em] uppercase text-[#9b9488] mb-4">
              {eyebrow}
            </div>
            <h1 className="font-serif font-medium text-[40px] md:text-[62px] leading-[1.02] text-ink mb-5">
              {h1}
            </h1>
            <p className="font-sans text-[16px] leading-[1.7] text-[#5b554c] max-w-[560px]">
              {cat.description}
            </p>
          </div>
        </header>

        {/* Passer d'une catégorie à l'autre sans repasser par la boutique.
            (Pas de compteurs ici : `counts` ne porte que la catégorie courante.) */}
        <CategoryStrip categories={categories} activeSlug={cat.slug} locale={locale} />

        {/* 3 · Chips rapides + 4 · Sidebar / contenu + grille + CTA */}
        <Suspense fallback={<div className="h-32" />}>
          <CategoryLayout
            categories={categories}
            materials={materials}
            collections={collections}
            counts={counts}
            resultCount={totalCount}
            shownCount={shownCount}
            quickFilters={quickFilters}
            pagination={
              <Pagination
                page={page}
                totalPages={totalPages}
                basePath={`/${categorie}`}
                searchParams={sp}
                locale={locale}
              />
            }
            locale={locale}
          >
            <ProductGrid
              products={pageProducts}
              resetHref={`/${categorie}`}
              columns={3}
              locale={locale}
            />
          </CategoryLayout>
        </Suspense>
      </div>

      {/* 5 · Section SEO */}
      {seoCopy && (
        <section className="bg-[#faf8f4] mt-16 md:mt-20 -mx-6 md:-mx-16 px-6 md:px-16 py-14 md:py-16">
          <div className="max-w-[820px] mx-auto">
            <h2 className="font-serif font-medium text-[28px] md:text-[34px] leading-[1.15] text-ink mb-5">
              {cat.seoHeading}
            </h2>
            <p className="font-sans text-[15px] leading-[1.85] text-[#5b554c]">
              {seoCopy}
            </p>
            {faqs.length > 0 && (
              <div className="mt-10 pt-9 border-t border-[#e6e1d8]">
                <h3 className="font-serif font-medium text-[24px] md:text-[28px] leading-[1.2] text-ink mb-6">
                  {locale === "en" ? "Frequently asked questions" : locale === "he" ? "שאלות נפוצות" : "Questions fréquentes"}
                </h3>
                <div className="space-y-6">
                  {faqs.map((faq) => (
                    <div key={faq.q}>
                      <h4 className="font-sans text-[15px] font-medium text-ink mb-2">
                        {faq.q}
                      </h4>
                      <p className="font-sans text-[14px] leading-[1.75] text-[#5b554c]">
                        {faq.a}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
