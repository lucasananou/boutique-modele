import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { ProductImage } from "@/components/ui/ProductImage";
import { Container } from "@/components/ui/Container";
import { HeroBuy } from "@/components/home/HeroBuy";
import { homeImages } from "@/lib/images";
import { formatPriceLocale } from "@/lib/format";
import { discountPercent } from "@/lib/productUtils";
import { localeConfig, localizedPath, type Locale } from "@/lib/i18n";
import { t, interpolate } from "@/lib/translations";
import type { Product } from "@/lib/types";

/**
 * Hero marchand : le visuel plein cadre est la pièce elle-même, et tout ce
 * qu'il faut pour l'acheter tient à droite. On passe de trois clics avant le
 * panier (accueil → catalogue → fiche → ajout) à un seul.
 *
 * Sans pièce à mettre en avant — catalogue vide, rupture générale — on retombe
 * sur le hero de marque : mieux vaut un slogan qu'un bloc d'achat cassé.
 */

/** Fenêtre de livraison indicative : J+2 à J+5, dans la langue servie. */
function deliveryWindow(locale: Locale): string {
  const format = new Intl.DateTimeFormat(localeConfig[locale].intlLocale, {
    day: "numeric",
    month: "long",
  });
  const now = Date.now();
  return format.formatRange(new Date(now + 2 * 86_400_000), new Date(now + 5 * 86_400_000));
}

export function Hero({
  product,
  salePercent,
  locale = "fr",
}: {
  product?: Product | null;
  salePercent?: number;
  locale?: Locale;
}) {
  const copy = t(locale).homePage.hero;
  if (!product) return <BrandHero salePercent={salePercent} locale={locale} />;

  const off = discountPercent(product.price, product.compareAtPrice);
  const visual = product.images[0];
  const thumb = product.images[1] ?? visual;

  // Sur desktop, header + hero tiennent dans une fenêtre : 113px est la hauteur
  // du header (bandeau défilant + barre de navigation), fixée par construction.
  // `dvh` et non `vh`, pour tenir compte des barres d'interface mobiles.
  return (
    <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:h-[calc(100dvh-113px)]">
      {/* Mobile : la proportion 3/4 des photos, silhouette entiere. Desktop :
          l'image remplit la hauteur disponible et rogne donc un peu, ancree en
          haut pour couper l'ourlet plutot que le visage. */}
      <div className="relative aspect-[3/4] lg:aspect-auto lg:h-full bg-sand">
        <ProductImage
          src={visual?.src ?? homeImages.hero}
          alt={visual?.alt ?? product.name}
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-top"
        />
        {salePercent ? (
          <div className="absolute left-0 bottom-10 bg-white px-6 py-5 shadow-[0_24px_60px_-28px_rgba(22,19,15,0.4)]">
            <div className="font-serif text-[34px] leading-none text-champagne">
              −{salePercent}%
            </div>
            <div className="font-sans text-[11px] tracking-[0.18em] uppercase text-warm-500 mt-2">
              {copy.flashSale}
            </div>
          </div>
        ) : null}
      </div>

      {/* Aligne en haut sur desktop, et non centre : l'image en 3/4 rend le
          hero haut, un bloc centre ferait tomber le bouton d'achat sous la
          ligne de flottaison des portables 720 px. */}
      <div className="flex flex-col justify-center px-6 md:px-12 lg:px-14 py-12 lg:py-8 lg:overflow-y-auto">
        {/* Le mot-clé du référencement reste en tête de page, au-dessus d'un
            titre qui, lui, vend un bénéfice plutôt qu'une posture. */}
        <div className="font-sans text-[11px] tracking-[0.26em] uppercase text-champagne mb-5">
          {copy.eyebrow} · {product.badge ?? copy.badgeFallback}
        </div>

        <h1 className="font-serif font-normal text-[40px] md:text-[54px] leading-[1.06] text-ink text-pretty mb-5">
          {copy.h1}
        </h1>

        <p className="font-sans text-[16px] leading-[1.75] text-warm-700 max-w-[460px] mb-10">
          {copy.intro}
        </p>

        <div className="border-t border-ink/12 pt-7">
          <div className="flex items-start gap-4 mb-6">
            <Link
              href={localizedPath(`/produit/${product.slug}`, locale)}
              className="relative w-[68px] aspect-[3/4] shrink-0 overflow-hidden bg-sand"
            >
              <ProductImage src={thumb?.src ?? ""} alt={thumb?.alt ?? product.name} />
            </Link>
            <div className="min-w-0">
              <div className="font-sans text-[10px] tracking-[0.22em] uppercase text-champagne mb-1.5">
                {copy.featuredLabel}
              </div>
              <Link
                href={localizedPath(`/produit/${product.slug}`, locale)}
                className="font-serif text-[21px] leading-[1.2] text-ink hover:text-champagne transition-colors block"
              >
                {product.name}
              </Link>
              <div className="font-sans text-[14px] text-warm-500 mt-1 flex flex-wrap items-baseline gap-x-2">
                <span>{product.materialLabel}</span>
                <span aria-hidden>·</span>
                <span className="text-ink">
                  {formatPriceLocale(product.price, locale)}
                </span>
                {off > 0 && (
                  <>
                    <span className="text-warm-400 line-through">
                      {formatPriceLocale(product.compareAtPrice!, locale)}
                    </span>
                    <span className="text-champagne">−{off}%</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <HeroBuy product={product} />

          <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
            <span className="font-sans text-[13px] text-warm-500">
              {interpolate(copy.deliveredBetween, { range: deliveryWindow(locale) })}
            </span>
            <Link
              href={localizedPath(`/produit/${product.slug}`, locale)}
              className="font-sans text-[13px] text-warm-700 border-b border-ink/25 pb-0.5 hover:text-champagne transition-colors"
            >
              {copy.viewProduct}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Hero d'origine, conservé comme repli. */
function BrandHero({
  salePercent,
  locale = "fr",
}: {
  salePercent?: number;
  locale?: Locale;
}) {
  const copy = t(locale).homePage.brandHero;
  const flash = t(locale).homePage.hero.flashSale;
  return (
    <Container>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center min-h-[480px] md:min-h-[560px]">
        <div className="py-10 md:py-16 animate-fade">
          <div className="font-sans text-[12px] tracking-[0.34em] uppercase text-warm-500 mb-6">
            {copy.eyebrow}
          </div>
          <h1 className="font-serif font-medium text-[44px] md:text-[68px] leading-[1.02] tracking-[-0.01em] text-ink mb-6">
            {copy.h1Line1}
            <br />
            {copy.h1Line2}
            <br />
            <span className="italic text-champagne">{copy.h1Accent}</span>
          </h1>
          <p className="font-sans text-[16px] leading-[1.7] text-warm-700 max-w-[430px] mb-9">
            {copy.intro}
          </p>
          <div className="flex flex-wrap gap-3.5 items-center">
            <ButtonLink href={localizedPath("/boutique", locale)} variant="solid">
              {copy.ctaShop}
            </ButtonLink>
            <ButtonLink
              href={localizedPath(copy.ctaCollectionHref, locale)}
              variant="link"
            >
              {copy.ctaCollection}
            </ButtonLink>
          </div>
        </div>

        <div className="relative h-[400px] md:h-[560px] animate-fade">
          <div className="absolute inset-y-6 md:inset-y-10 inset-x-0 bg-sand overflow-hidden">
            <ProductImage
              src={homeImages.hero}
              alt={copy.imageAlt}
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          {salePercent ? (
            <div className="absolute -left-3 md:-left-8 bottom-16 bg-white px-6 py-5 shadow-[0_24px_60px_-28px_rgba(22,19,15,0.4)] max-w-[200px]">
              <div className="font-serif text-[34px] leading-none text-champagne">
                −{salePercent}%
              </div>
              <div className="font-sans text-[11px] tracking-[0.18em] uppercase text-warm-500 mt-2">
                {flash}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Container>
  );
}
