import type { Metadata } from "next";
import Link from "next/link";
import { getCollections } from "@/lib/taxonomy";
import { getProductsByCollection } from "@/lib/products";
import { ProductImage } from "@/components/ui/ProductImage";
import { ProductCard } from "@/components/product/ProductCard";
import { Container } from "@/components/ui/Container";
import { headers } from "next/headers";
import { localizedPath, type Locale } from "@/lib/i18n";
import { languageAlternates } from "@/lib/hreflang";
import { t } from "@/lib/translations";

export async function generateMetadata(): Promise<Metadata> {
  const localeHeader = (await headers()).get("x-store-locale");
  const locale: Locale = localeHeader === "en" || localeHeader === "he" ? localeHeader : "fr";
  const copy = t(locale).collectionsPage;
  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
    alternates: {
      canonical: localizedPath("/collections", locale),
      languages: languageAlternates("/collections"),
    },
  };
}

export default async function CollectionsPage() {
  const localeHeader = (await headers()).get("x-store-locale");
  const locale: Locale = localeHeader === "en" || localeHeader === "he" ? localeHeader : "fr";
  const copy = t(locale);
  const collections = await getCollections(locale);
  const productsByCol = await Promise.all(
    collections.map((c) => getProductsByCollection(c.slug, locale)),
  );

  return (
    <Container className="py-12 md:py-16">
      <header className="text-center mb-14 md:mb-20">
        <div className="eyebrow mb-4">{copy.collectionsPage.eyebrow}</div>
        <h1 className="font-serif font-normal text-[40px] md:text-[52px] text-ink">
          {copy.collectionsPage.h1}
        </h1>
        <p className="font-sans text-[15px] leading-[1.7] text-warm-700 max-w-[600px] mx-auto mt-4">
          {copy.collectionsPage.intro}
        </p>
      </header>

      <div className="flex flex-col gap-20 md:gap-28">
        {collections.map((c, i) => {
          const products = productsByCol[i];
          return (
            <section key={c.slug}>
              {/* En-tête éditoriale alternée */}
              <div
                className={[
                  "grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center mb-10 md:mb-12",
                  i % 2 === 1 ? "md:[&>a]:order-2" : "",
                ].join(" ")}
              >
                <Link
                  href={localizedPath(`/collection/${c.slug}`, locale)}
                  className="relative block h-[320px] md:h-[460px] rounded-sm overflow-hidden group bg-sand"
                >
                  <ProductImage
                    src={c.heroImage.src}
                    alt={c.heroImage.alt}
                    className="transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </Link>
                <div>
                  {c.season && <div className="eyebrow mb-4">{c.season}</div>}
                  <h2 className="font-serif font-normal text-[34px] md:text-[44px] leading-[1.05] text-ink mb-5">
                    {c.name}
                  </h2>
                  <p className="font-sans text-[16px] leading-[1.8] text-warm-700 mb-7 max-w-[480px]">
                    {c.description}
                  </p>
                  <Link
                    href={localizedPath(`/collection/${c.slug}`, locale)}
                    className="font-sans text-[13px] tracking-[0.12em] uppercase text-ink border-b border-champagne pb-1 hover:text-champagne transition-colors"
                  >
                    {copy.common.discover} — {products.length}{" "}
                    {products.length > 1 ? copy.common.pieces : copy.common.piece} →
                  </Link>
                </div>
              </div>

              {/* Aperçu produits de la collection */}
              {products.length > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                  {products.slice(0, 4).map((p) => (
                    <ProductCard key={p.id} product={p} locale={locale} />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </Container>
  );
}
