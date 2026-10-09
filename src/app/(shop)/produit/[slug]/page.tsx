import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import {
  getAllProducts,
  getFrequentlyBoughtWith,
  getProductBySlug,
  retiredProductCategory,
  getProductsByCollection,
} from "@/lib/products";
import { ProductGallery } from "@/components/product/ProductGallery";
import { AddToCartPanel } from "@/components/product/AddToCartPanel";
import { ProductVariantSelectionProvider } from "@/components/product/ProductVariantSelection";
import { ProductCard } from "@/components/product/ProductCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { productLd, breadcrumbLd } from "@/lib/jsonld";
import { requestOrigin } from "@/lib/site";
import { getActiveFlashSale } from "@/lib/flashSale";
import { Container } from "@/components/ui/Container";
import { TrackView } from "@/components/analytics/EcommerceTrackers";
import { store } from "@/stores";
import { ProductHighlights } from "@/components/product/ProductHighlights";
import { BoughtTogether } from "@/components/product/BoughtTogether";
import { categoryPath } from "@/lib/categories";
import { parseFeatures, toParagraphs } from "@/lib/productText";
import { headers } from "next/headers";
import { localizedPath, type Locale } from "@/lib/i18n";
import { languageAlternates } from "@/lib/hreflang";
import { t } from "@/lib/translations";

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const localeHeader = (await headers()).get("x-store-locale");
  const locale: Locale = localeHeader === "en" || localeHeader === "he" ? localeHeader : "fr";
  const product = await getProductBySlug(slug, locale);
  if (!product) return {};
  const ogImage = product.images.find((i) => i.src)?.src;
  const title = product.seoTitle || product.name;
  const description = product.seoDescription || product.shortDescription;
  return {
    title,
    description,
    alternates: {
      canonical: locale === "fr" ? `/produit/${product.slug}` : `/${locale}/produit/${product.slug}`,
      languages: languageAlternates(`/produit/${product.slug}`),
    },
    openGraph: {
      title,
      description,
      url: `/produit/${product.slug}`,
      type: "website",
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const localeHeader = (await headers()).get("x-store-locale");
  const locale: Locale = localeHeader === "en" || localeHeader === "he" ? localeHeader : "fr";
  // Origine de la requête : les données structurées doivent porter les URLs
  // du domaine réellement servi, pas celles figées au build.
  const origin = await requestOrigin();
  const copy = t(locale);
  const product = await getProductBySlug(slug, locale);
  if (!product) {
    // Fiche retirée ou ancienne URL : direction la catégorie la plus proche.
    const retiredCategory = await retiredProductCategory(slug);
    if (retiredCategory) permanentRedirect(localizedPath(await categoryPath(retiredCategory), locale));
    notFound();
  }
  const categoryHrefValue = await categoryPath(product.category);

  const boughtTogether = await getFrequentlyBoughtWith(product, locale);
  const boughtTogetherIds = new Set(boughtTogether.map((p) => p.id));
  // La même pièce ne doit pas figurer dans les deux blocs : la suggestion
  // d'achat prime, la grille de collection se complète en dessous.
  const related = (await getProductsByCollection(product.collection, locale))
    .filter((p) => p.id !== product.id && !boughtTogetherIds.has(p.id))
    .slice(0, 4);
  const flashSale = await getActiveFlashSale();
  const features = parseFeatures(product.shortDescription);
  const descParagraphs = toParagraphs(product.description);
  const initialVariantId = product.variants.find((v) => v.available)?.id;

  return (
    <Container className="py-8 md:py-12">
      <TrackView
        slug={product.slug}
        name={product.name}
        priceCents={product.price}
        category={product.category}
      />
      <JsonLd
        data={[
          productLd(product, origin),
          breadcrumbLd([
            { name: copy.common.home, path: "/" },
            { name: product.categoryName, path: categoryHrefValue },
            { name: product.name, path: `/produit/${product.slug}` },
          ], origin),
        ]}
      />
      {/* Fil d'Ariane */}
      <nav className="font-sans text-[12px] text-warm-500 mb-8 flex flex-wrap gap-1.5">
        <Link href={localizedPath("/", locale)} className="hover:text-champagne transition-colors">
          {copy.common.home}
        </Link>
        <span>/</span>
        <Link
          href={localizedPath(categoryHrefValue, locale)}
          className="hover:text-champagne transition-colors"
        >
          {product.categoryName}
        </Link>
        <span>/</span>
        <span className="text-ink">{product.name}</span>
      </nav>

      <ProductVariantSelectionProvider initialVariantId={initialVariantId}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start">
          <div className="md:sticky md:top-28">
            <ProductGallery product={product} />
          </div>

          <div>
            <div className="eyebrow mb-3">
              {product.categoryName} · {product.collectionName}
            </div>
            <h1 className="font-serif font-normal text-[36px] md:text-[44px] leading-[1.08] text-ink mb-3">
              {product.name}
            </h1>
            {/* La composition vit désormais uniquement dans les
                caractéristiques, plus bas — elle y était déjà en double. */}
            {/* Preuve sociale : affichée seulement si la boutique la renseigne
                (translations.product.satisfied) — ne jamais l'inventer. */}
            {copy.product.satisfied ? (
              <div className="flex items-center gap-2 mb-6">
                <span
                  aria-hidden="true"
                  className="text-champagne text-[14px] tracking-[0.15em]"
                >
                  ★★★★★
                </span>
                <span className="font-sans text-[13px] text-warm-700">
                  {copy.product.satisfied}
                </span>
              </div>
            ) : (
              <div className="mb-6" />
            )}
            {/* L'argumentaire descend sous le prix : une cliente cherche
                d'abord le montant, l'argument le justifie ensuite. */}
            <AddToCartPanel
              product={product}
              flashSale={flashSale}
              locale={locale}
              intro={
                features ? (
                  <ul className="flex flex-col gap-2.5">
                    {features.map((f, i) => (
                      <li key={i} className="flex gap-3 items-start">
                        <span
                          aria-hidden
                          className="shrink-0 mt-[3px] w-[18px] h-[18px] rounded-full bg-champagne/15 text-champagne flex items-center justify-center text-[11px]"
                        >
                          ✓
                        </span>
                        <span className="font-sans text-[15px] leading-[1.6] text-warm-700">
                          {f.label && (
                            <strong className="text-ink font-medium">
                              {f.label} :{" "}
                            </strong>
                          )}
                          {f.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="font-sans text-[16px] leading-[1.8] text-warm-700">
                    {product.shortDescription}
                  </p>
                )
              }
            />

            <BoughtTogether products={boughtTogether} locale={locale} />

            {store.sections.productHighlights ? (
              <div className="mt-8">
                <ProductHighlights locale={locale} />
              </div>
            ) : null}

            {/* Description longue */}
            <div className="mt-10 pt-10 border-t border-ink/10">
              {descParagraphs.map((p, i) => (
                <p
                  key={i}
                  className="font-sans text-[15px] leading-[1.85] text-warm-700 mb-4 last:mb-0"
                >
                  {p}
                </p>
              ))}
            </div>

            {product.details.length > 0 && (
              <div className="mt-8 pt-8 border-t border-ink/10">
                <div className="eyebrow mb-5">{copy.product.characteristics}</div>
                <dl className="flex flex-col gap-3">
                  {product.details.map((d) => (
                    <div
                      key={d.label}
                      className="flex justify-between gap-4 font-sans text-[14px]"
                    >
                      <dt className="text-warm-500">{d.label}</dt>
                      <dd className="text-ink text-right">{d.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </div>
      </ProductVariantSelectionProvider>

      {/* Pièces qui s'accordent */}
      {related.length > 0 && (
        <section className="mt-20 md:mt-28">
          <div className="flex items-end justify-between mb-10">
            <h2 className="font-serif font-normal text-[28px] md:text-[36px] text-ink">
              {copy.product.related}
            </h2>
            <Link
              href={localizedPath(`/collection/${product.collection}`, locale)}
              className="font-sans text-[13px] text-warm-700 border-b border-ink/25 pb-1 hover:text-champagne transition-colors"
            >
              {copy.common.viewCollection}
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-7">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} locale={locale} />
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}
