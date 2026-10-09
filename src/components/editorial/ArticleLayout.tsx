import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { ProductImage } from "@/components/ui/ProductImage";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";
import { JsonLd } from "@/components/seo/JsonLd";
import { ArticleToc } from "@/components/editorial/ArticleToc";
import { ArticleFaq } from "@/components/editorial/ArticleFaq";
import { ArticleOutfit } from "@/components/editorial/ArticleOutfit";
import { StickyProductRail } from "@/components/editorial/StickyProductRail";
import { articleLd, breadcrumbLd, faqPageLd } from "@/lib/jsonld";
import { requestOrigin } from "@/lib/site";
import { formatDateFr } from "@/lib/format";
import { localeConfig, localizedPath, type Locale } from "@/lib/i18n";
import {
  getRelatedArticles,
  DEFAULT_AUTHOR,
  type ArticleMeta,
  type ContentPage,
} from "@/lib/pages";
import { resolveOutfit } from "@/lib/editorialProducts";
import { htmlToReact } from "@/lib/htmlToReact";
import { CitedProduct } from "@/components/editorial/CitedProduct";

type ForeignLocale = Exclude<Locale, "fr">;

const foreignArticleCopy = {
  en: {
    home: "Home",
    journal: "Journal",
    eyebrow: "Guide",
    by: "By",
    updated: "Updated",
    read: "min read",
    related: "Keep reading",
    fallbackOutfitTitle: "Featured products",
    title: "This guide is being translated",
    body:
      "The French version of this article is available, but the English translation is still being reviewed. To avoid publishing approximate wording, we keep this page out of indexing until the translation is complete.",
    shopCta: "Browse the shop",
    contactCta: "Ask us a question",
  },
  he: {
    home: "בית",
    journal: "מגזין",
    eyebrow: "מדריך",
    by: "מאת",
    updated: "עודכן",
    read: "דקות קריאה",
    related: "להמשך קריאה",
    fallbackOutfitTitle: "פריטים שמתאימים להנחיות האלה",
    title: "המדריך הזה בתהליך תרגום",
    body:
      "הגרסה הצרפתית של המאמר זמינה, אך התרגום לעברית עדיין בבדיקה. כדי לא לפרסם ניסוח לא מדויק, העמוד נשאר מחוץ לאינדוקס עד השלמת התרגום.",
    shopCta: "לחנות",
    contactCta: "שאלה לצוות",
  },
} satisfies Record<ForeignLocale, Record<string, string>>;

function localeFromHeaders(value: string | null): Locale {
  return value === "en" || value === "he" ? value : "fr";
}

function formatArticleDate(date: string, locale: Locale) {
  if (locale === "fr") return formatDateFr(date);
  return new Intl.DateTimeFormat(localeConfig[locale].intlLocale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

/** Corps HTML (base) → React ; les blocs « produit cité » sont résolus. */
function ArticleBody({ html, locale }: { html: string; locale: Locale }) {
  return htmlToReact(html, (props, key) => (
    <CitedProduct
      key={key}
      slug={props.slug}
      category={props.category}
      match={props.match}
      label={props.label}
      locale={locale}
    />
  ));
}

/** Traduction utilisable d'un article (titre + corps), sinon undefined. */
function translationOf(a: ContentPage, locale: Locale) {
  if (locale === "fr") return undefined;
  const tr = a.translations[locale];
  return tr?.title && tr.body ? tr : undefined;
}

/** Métadonnées Next pour une page article. */
export async function articleMetadata(a: ContentPage): Promise<Metadata> {
  const locale = localeFromHeaders((await headers()).get("x-store-locale"));
  const canonical = a.canonical ?? `/${a.slug}`;
  if (locale !== "fr") {
    const translated = translationOf(a, locale);
    if (translated) {
      return {
        title: translated.title!,
        description: translated.excerpt ?? a.excerpt,
        robots: { index: false, follow: true },
        alternates: { canonical: localizedPath(canonical, locale) },
        openGraph: {
          title: translated.title!,
          description: translated.excerpt ?? a.excerpt,
          type: "article",
          images: [a.image],
          authors: [a.author ?? DEFAULT_AUTHOR],
          ...(a.publishedAt ? { publishedTime: a.publishedAt } : {}),
          ...(a.updatedAt ? { modifiedTime: a.updatedAt } : {}),
        },
        twitter: {
          card: "summary_large_image",
          title: translated.title!,
          description: translated.excerpt ?? a.excerpt,
          images: [a.image],
        },
      };
    }
    const copy = foreignArticleCopy[locale];
    return {
      title: copy.title,
      description: copy.body,
      robots: { index: false, follow: true },
      alternates: { canonical },
    };
  }
  return {
    title: a.title,
    description: a.excerpt,
    alternates: { canonical },
    openGraph: {
      title: a.title,
      description: a.excerpt,
      type: "article",
      images: [a.image],
      authors: [a.author ?? DEFAULT_AUTHOR],
      ...(a.publishedAt ? { publishedTime: a.publishedAt } : {}),
      ...(a.updatedAt ? { modifiedTime: a.updatedAt } : {}),
    },
    // Carte Twitter/X DÉDIÉE à l'article (avant, elle reprenait celle du site).
    twitter: {
      card: "summary_large_image",
      title: a.title,
      description: a.excerpt,
      images: [a.image],
    },
  };
}

/**
 * Mise en page éditoriale d'un article : en-tête signé + daté, sommaire ancré,
 * colonne de lecture, colonne produits collante, FAQ, « la tenue de l'article »,
 * articles liés et rappel newsletter. Les blocs produits/FAQ ne s'affichent que
 * si l'article les renseigne.
 */
export async function ArticleLayout({ page: a }: { page: ContentPage }) {
  const slug = a.slug;
  const locale = localeFromHeaders((await headers()).get("x-store-locale"));
  // Origine de la requête : les données structurées doivent porter les URLs
  // du domaine réellement servi, pas celles figées au build.
  const origin = await requestOrigin();

  const translated = translationOf(a, locale);

  if (locale !== "fr" && !translated) {
    const copy = foreignArticleCopy[locale];
    return (
      <Container className="pt-10 md:pt-12 pb-16 md:pb-24">
        <div className="max-w-[900px] mx-auto">
          <Breadcrumb
            items={[
              { label: copy.home, href: localizedPath("/", locale) },
              { label: copy.journal, href: localizedPath("/journal", locale) },
              { label: copy.eyebrow },
            ]}
          />
          <header className="max-w-[720px] mx-auto text-center pt-10 md:pt-16">
            <div className="font-sans text-[11px] tracking-[0.26em] uppercase text-champagne mb-6">
              {copy.eyebrow}
            </div>
            <h1 className="font-serif font-light text-[36px] md:text-[56px] leading-[1.08] text-ink text-balance">
              {copy.title}
            </h1>
            <p className="font-sans text-[16px] md:text-[18px] leading-[1.8] text-warm-700 mt-6">
              {copy.body}
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-9">
              <Link
                href={localizedPath("/boutique", locale)}
                className="font-sans text-[13px] tracking-[0.08em] uppercase text-ivory-light bg-ink px-7 py-4 rounded-xs hover:bg-champagne transition-colors"
              >
                {copy.shopCta}
              </Link>
              <Link
                href={localizedPath("/rendez-vous", locale)}
                className="font-sans text-[13px] tracking-[0.08em] uppercase text-ink border-b border-champagne pb-1 self-center hover:text-champagne transition-colors"
              >
                {copy.contactCta}
              </Link>
            </div>
          </header>
        </div>
      </Container>
    );
  }

  const author = a.author ?? DEFAULT_AUTHOR;
  const copy = locale === "fr" ? null : foreignArticleCopy[locale];
  const updatedLabel = a.updatedAt ? formatArticleDate(a.updatedAt, locale) : null;
  const outfit = locale === "fr" && a.outfitCategories?.length
    ? await resolveOutfit(a.outfitCategories, locale)
    : [];
  const related = locale === "fr" ? await getRelatedArticles(slug, 3) : [];
  const title = translated?.title ?? a.title;
  const excerpt = translated?.excerpt ?? a.excerpt;
  const category = translated?.category ?? a.category;
  const articleChildren = <ArticleBody html={translated?.body ?? a.body} locale={locale} />;
  const faqs = translated?.faqs ?? a.faqs;
  const outfitTitle =
    translated?.outfitTitle ??
    a.outfitTitle ??
    (copy?.fallbackOutfitTitle ?? "Les pièces qui suivent ces repères");

  return (
    <>
      <JsonLd
        data={[
          articleLd({
            title,
            description: excerpt,
            slug: locale === "fr" ? a.slug : `${locale}/${a.slug}`,
            image: a.image,
            author,
            language: localeConfig[locale].htmlLang,
            datePublished: a.publishedAt,
            dateModified: a.updatedAt,
          }, origin),
          breadcrumbLd([
            { name: copy?.home ?? "Accueil", path: localizedPath("/", locale) },
            { name: copy?.journal ?? "Journal", path: localizedPath("/journal", locale) },
            { name: title, path: localizedPath(`/${a.slug}`, locale) },
          ], origin),
          ...(faqs?.length ? [faqPageLd(faqs)] : []),
        ]}
      />

      <Container className="pt-10 md:pt-12 pb-12 md:pb-16">
        <div className="max-w-[1140px] mx-auto">
          <Breadcrumb
            items={[
              { label: copy?.home ?? "Accueil", href: localizedPath("/", locale) },
              { label: copy?.journal ?? "Journal", href: localizedPath("/journal", locale) },
              { label: title },
            ]}
          />

          {/* En-tête éditorial centré */}
          <header className="max-w-[720px] mx-auto text-center pt-10 md:pt-14">
            <div className="font-sans text-[11px] tracking-[0.26em] uppercase text-champagne mb-6">
              {(copy?.journal ?? "Journal")} · {category}
            </div>
            <h1 className="font-serif font-light text-[34px] md:text-[52px] leading-[1.1] text-ink text-balance">
              {title}
            </h1>
            <div className="font-sans text-[13.5px] text-warm-500 mt-6 flex flex-wrap gap-x-3 gap-y-1 justify-center items-center">
              <span>{copy?.by ?? "Par"} {author}</span>
              {updatedLabel && (
                <>
                  <span className="opacity-45">—</span>
                  <span>{copy?.updated ?? "Mis à jour le"} {updatedLabel}</span>
                </>
              )}
              {a.readingMinutes && (
                <>
                  <span className="opacity-45">—</span>
                  <span>{a.readingMinutes} {copy?.read ?? "min de lecture"}</span>
                </>
              )}
            </div>
          </header>

          {/* Visuel d'ouverture */}
          <figure className="relative aspect-[16/10] md:aspect-[21/9] bg-sand overflow-hidden mt-10 md:mt-12">
            <ProductImage
              src={a.image}
              alt={title}
              priority
              sizes="(max-width: 1140px) 100vw, 1140px"
            />
          </figure>

          {/* Corps : sommaire | lecture | (pièces citées, si l'article en a) */}
          <div
            className={`grid grid-cols-1 gap-10 lg:gap-12 mt-12 md:mt-16 ${
              outfit.length
                ? "lg:grid-cols-[190px_minmax(0,1fr)_220px]"
                : "lg:grid-cols-[200px_minmax(0,1fr)]"
            }`}
          >
            <ArticleToc locale={locale} />

            <div className="min-w-0">
              <div id="article-body" className="article-prose">
                {articleChildren}
              </div>

              {faqs?.length ? <ArticleFaq items={faqs} locale={locale} /> : null}

              {outfit.length ? (
                <ArticleOutfit
                  title={outfitTitle}
                  products={outfit}
                />
              ) : null}

              {related.length ? <RelatedArticles related={related} /> : null}
            </div>

            {outfit.length ? (
              <StickyProductRail products={outfit.slice(0, 2)} />
            ) : null}
          </div>
        </div>
      </Container>
    </>
  );
}

/** « Poursuivre la lecture » — maillage interne en fin d'article. */
function RelatedArticles({ related }: { related: ArticleMeta[] }) {
  return (
    <div className="border-t border-ink pt-6 mt-12">
      <div className="font-sans text-[10px] tracking-[0.22em] uppercase text-champagne mb-5">
        Poursuivre la lecture
      </div>
      <div className="grid gap-4">
        {related.map((r) => (
          <Link
            key={r.slug}
            href={`/${r.slug}`}
            className="group flex justify-between gap-6 items-baseline border-b border-[rgba(26,24,21,0.1)] pb-3.5"
          >
            <span className="font-serif text-[20px] md:text-[21px] leading-snug text-ink group-hover:text-champagne transition-colors">
              {r.title}
            </span>
            <span className="font-sans text-[12px] text-warm-500 whitespace-nowrap shrink-0">
              {r.category}
              {r.readingMinutes ? ` · ${r.readingMinutes} min` : ""}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
