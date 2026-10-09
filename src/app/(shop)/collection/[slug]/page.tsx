import { store } from "@/stores";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCollection, getCollections } from "@/lib/taxonomy";
import { requestOrigin } from "@/lib/site";
import { getProductsByCollection } from "@/lib/products";
import { ProductImage } from "@/components/ui/ProductImage";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbLd, itemListLd } from "@/lib/jsonld";
import { headers } from "next/headers";
import { localizedPath, type Locale } from "@/lib/i18n";
import { languageAlternates } from "@/lib/hreflang";
import { t } from "@/lib/translations";

// Revalidation incrémentale : un nouveau produit/collection apparaît sous 60 s.
export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  const collections = await getCollections();
  return collections.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const localeHeader = (await headers()).get("x-store-locale");
  const locale: Locale = localeHeader === "en" || localeHeader === "he" ? localeHeader : "fr";
  const collection = await getCollection(slug, locale);
  if (!collection) return {};
  return {
    title: `Collection ${collection.name} — ${store.brand.name}`,
    description: collection.description,
    alternates: {
      canonical: localizedPath(`/collection/${collection.slug}`, locale),
      languages: languageAlternates(`/collection/${collection.slug}`),
    },
  };
}

export default async function CollectionPage({
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
  const collection = await getCollection(slug, locale);
  if (!collection) notFound();

  const products = await getProductsByCollection(slug, locale);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: copy.common.home, path: "/" },
            { name: copy.common.collections, path: "/collections" },
            { name: collection.name, path: `/collection/${collection.slug}` },
          ], origin),
          itemListLd(products, origin),
        ]}
      />
      <section className="relative h-[380px] md:h-[520px] overflow-hidden">
        <ProductImage
          src={collection.heroImage.src}
          alt={collection.heroImage.alt}
          priority
          sizes="100vw"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(28,23,18,0.55) 0%, rgba(28,23,18,0.1) 50%, transparent 80%)",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 px-6 md:px-16 pb-10 md:pb-14 text-center">
          {collection.season && (
            <div className="font-sans text-[11px] tracking-[0.3em] uppercase text-white/82 mb-4">
              {collection.season}
            </div>
          )}
          <h1 className="font-serif font-normal text-[44px] md:text-[64px] text-ivory-light">
            {collection.name}
          </h1>
        </div>
      </section>

      <div className="px-6 md:px-16 py-16 md:py-20">
        <p className="font-serif font-normal text-[22px] md:text-[28px] leading-[1.5] text-ink max-w-[760px] mx-auto text-center mb-16">
          {collection.description}
        </p>
        <ProductGrid products={products} columns={3} locale={locale} />
      </div>
    </>
  );
}
