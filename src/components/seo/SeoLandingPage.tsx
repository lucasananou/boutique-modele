import Link from "next/link";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ProductCard } from "@/components/product/ProductCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbLd, faqPageLd, itemListLd } from "@/lib/jsonld";
import { requestOrigin } from "@/lib/site";
import { localizedPath, type Locale } from "@/lib/i18n";
import type { Product } from "@/lib/types";

export interface SeoLandingSection {
  title: string;
  body: string;
}

export interface SeoLandingFaq {
  q: string;
  a: string;
}

export interface SeoLandingLink {
  href: string;
  label: string;
}

/** Contenu d'une landing SEO (stocké en base : Page.data, kind = "landing"). */
export interface SeoLandingConfig {
  slug: string;
  title: string;
  description: string;
  eyebrow: string;
  intro: string;
  /** Catégorie catalogue des produits proposés (slug). */
  productCategory: string;
  productHints: string[];
  primaryCta: SeoLandingLink;
  secondaryCta?: SeoLandingLink;
  sections: SeoLandingSection[];
  faqs: SeoLandingFaq[];
  relatedLinks: SeoLandingLink[];
}

interface Props {
  eyebrow: string;
  title: string;
  intro: string;
  canonical: string;
  products: Product[];
  sections: SeoLandingSection[];
  faqs: SeoLandingFaq[];
  primaryCta: SeoLandingLink;
  secondaryCta?: SeoLandingLink;
  relatedLinks: SeoLandingLink[];
  locale?: Locale;
}

// Composant serveur asynchrone : il lit l'origine de la requête pour que les
// données structurées portent les URLs du domaine réellement servi.
export async function SeoLandingPage({
  eyebrow,
  title,
  intro,
  canonical,
  products,
  sections,
  faqs,
  primaryCta,
  secondaryCta,
  relatedLinks,
  locale = "fr",
}: Props) {
  const origin = await requestOrigin();
  const labels = {
    fr: {
      home: "Accueil",
      selection: "Sélection à découvrir",
      viewAll: "Tout voir",
      faq: "Questions fréquentes",
      related: "Pages associées",
    },
    en: {
      home: "Home",
      selection: "Selection to discover",
      viewAll: "View all",
      faq: "Frequently asked questions",
      related: "Related pages",
    },
    he: {
      home: "בית",
      selection: "מבחר שכדאי לגלות",
      viewAll: "לכל הפריטים",
      faq: "שאלות נפוצות",
      related: "עמודים קשורים",
    },
  }[locale];
  const primaryHref = localizedPath(primaryCta.href, locale);
  const secondaryHref = secondaryCta
    ? localizedPath(secondaryCta.href, locale)
    : undefined;

  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: labels.home, path: localizedPath("/", locale) },
            { name: title, path: canonical },
          ], origin),
          itemListLd(products, origin),
          faqPageLd(faqs),
        ]}
      />

      <Container className="py-10 md:py-16">
        <Breadcrumb
          items={[{ label: labels.home, href: localizedPath("/", locale) }, { label: title }]}
        />

        <header className="mt-9 md:mt-12 max-w-[860px]">
          <div className="eyebrow mb-5">{eyebrow}</div>
          <h1 className="font-serif font-medium text-[42px] md:text-[66px] leading-[1.02] text-ink">
            {title}
          </h1>
          <p className="font-sans text-[16px] md:text-[18px] leading-[1.75] text-warm-700 max-w-[720px] mt-6">
            {intro}
          </p>
          <div className="flex flex-wrap gap-3.5 mt-8">
            <ButtonLink href={primaryHref} variant="solid">
              {primaryCta.label}
            </ButtonLink>
            {secondaryCta ? (
              <ButtonLink href={secondaryHref ?? secondaryCta.href} variant="link">
                {secondaryCta.label}
              </ButtonLink>
            ) : null}
          </div>
        </header>

        {products.length > 0 && (
          <section className="mt-14 md:mt-18">
            <div className="flex items-end justify-between gap-6 mb-7">
              <h2 className="font-serif font-normal text-[30px] md:text-[38px] text-ink">
                {labels.selection}
              </h2>
              <Link
                href={primaryHref}
                className="font-sans text-[13px] text-warm-700 border-b border-ink/25 pb-1 hover:text-champagne transition-colors"
              >
                {labels.viewAll}
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-7">
              {products.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} locale={locale} />
              ))}
            </div>
          </section>
        )}

        <section className="grid md:grid-cols-3 gap-8 md:gap-10 mt-16 md:mt-22 border-t border-sand-soft pt-12">
          {sections.map((section) => (
            <article key={section.title}>
              <h2 className="font-serif font-normal text-[25px] leading-[1.15] text-ink mb-4">
                {section.title}
              </h2>
              <p className="font-sans text-[15px] leading-[1.85] text-warm-700">
                {section.body}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-16 md:mt-20 bg-mineral px-6 md:px-10 py-10 md:py-12">
          <h2 className="font-serif font-normal text-[30px] md:text-[38px] text-ink mb-8">
            {labels.faq}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {faqs.map((faq) => (
              <div key={faq.q}>
                <h3 className="font-sans text-[15px] font-medium text-ink mb-2">
                  {faq.q}
                </h3>
                <p className="font-sans text-[14px] leading-[1.75] text-warm-700">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        <nav className="mt-12 flex flex-wrap gap-3" aria-label={labels.related}>
          {relatedLinks.map((link) => (
            <Link
              key={link.href}
              href={localizedPath(link.href, locale)}
              className="inline-flex h-[39px] items-center rounded-full border border-sand-soft px-4 font-sans text-[13px] text-warm-700 hover:border-ink hover:text-ink transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </Container>
    </>
  );
}
