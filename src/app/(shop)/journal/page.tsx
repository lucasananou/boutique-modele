import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { PageHero } from "@/components/editorial/PageHero";
import { ProductImage } from "@/components/ui/ProductImage";
import { Container } from "@/components/ui/Container";
import { JournalFilters } from "@/components/editorial/JournalFilters";
import {
  articleCard,
  getArticles,
  getSetting,
  type JournalSettings,
} from "@/lib/pages";
import { formatDateFr } from "@/lib/format";
import { localizedPath, type Locale } from "@/lib/i18n";

/** Textes de repli si le réglage « journal » est absent (boutique neuve). */
const defaultCopy: Record<Locale, Record<string, string>> = {
  fr: {
    title: "Journal",
    description: "Conseils, guides et nouveautés de la boutique.",
    eyebrow: "Le Journal",
    heroTitle: "Conseils & guides",
    subtitle: "",
    featured: "A la une",
    readGuide: "Lire le guide ->",
    hubsEyebrow: "Nos dossiers",
    hubsTitle: "",
  },
  en: {
    title: "Journal",
    description: "Advice, guides and news from the shop.",
    eyebrow: "Journal",
    heroTitle: "Advice & guides",
    subtitle: "",
    featured: "Featured",
    readGuide: "Read the guide ->",
    hubsEyebrow: "Our guides",
    hubsTitle: "",
  },
  he: {
    title: "מגזין",
    description: "",
    eyebrow: "מגזין",
    heroTitle: "",
    subtitle: "",
    featured: "מומלץ",
    readGuide: "לקריאת המדריך ->",
    hubsEyebrow: "המדריכים שלנו",
    hubsTitle: "",
  },
};

/** Réglage « journal » (table Setting) : textes, article à la une, dossiers. */
async function journalSettings(locale: Locale) {
  const settings = await getSetting<JournalSettings>("journal", { hubs: [], copy: {} });
  return {
    ...settings,
    c: { ...defaultCopy[locale], ...(settings.copy[locale] ?? {}) },
  };
}

async function currentLocale(): Promise<Locale> {
  const h = (await headers()).get("x-store-locale");
  return h === "en" || h === "he" ? h : "fr";
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await currentLocale();
  const { c } = await journalSettings(locale);
  return {
    title: c.title,
    description: c.description,
    alternates: { canonical: localizedPath("/journal", locale) },
  };
}

export default async function JournalPage() {
  const locale = await currentLocale();

  const [{ c, featured: featuredSlug, hubs }, articles] = await Promise.all([
    journalSettings(locale),
    getArticles(),
  ]);
  const bySlug = new Map(articles.map((a) => [a.slug, a]));
  const featured = featuredSlug ? bySlug.get(featuredSlug) : undefined;
  const rest = articles.filter((a) => a.slug !== featured?.slug);
  const featuredCard = featured ? articleCard(featured, locale) : null;

  return (
    <>
      <PageHero eyebrow={c.eyebrow} title={c.heroTitle} subtitle={c.subtitle} />
      <Container className="pb-20">
        {featured && featuredCard && (
          <section className="grid md:grid-cols-[1.2fr_1fr] gap-8 md:gap-11 items-center mb-16 md:mb-20">
            <Link
              href={localizedPath(`/${featured.slug}`, locale)}
              className="relative block aspect-[16/11] bg-sand overflow-hidden rounded-md"
            >
              <ProductImage
                src={featured.image}
                alt={featuredCard.title}
                priority
                sizes="(max-width: 768px) 100vw, 55vw"
              />
            </Link>
            <div>
              <div className="font-sans text-[10px] tracking-[0.22em] uppercase text-champagne mb-4">
                {c.featured} · {featuredCard.category}
              </div>
              <h2 className="font-serif text-[30px] md:text-[40px] leading-[1.1] text-ink mb-4 text-balance">
                <Link
                  href={localizedPath(`/${featured.slug}`, locale)}
                  className="hover:text-champagne transition-colors"
                >
                  {featuredCard.title}
                </Link>
              </h2>
              <p className="font-sans text-[15px] md:text-[16px] leading-[1.7] text-warm-700 mb-5 max-w-[46ch]">
                {featuredCard.excerpt}
              </p>
              <div className="flex items-center gap-4 flex-wrap">
                <Link
                  href={localizedPath(`/${featured.slug}`, locale)}
                  className="font-sans text-[11px] tracking-[0.16em] uppercase text-ink border-b border-ink pb-1.5 hover:text-champagne hover:border-champagne transition-colors"
                >
                  {c.readGuide}
                </Link>
                {featured.readingMinutes && (
                  <span className="font-sans text-[13px] text-warm-500">
                    {featured.readingMinutes} min
                    {locale === "fr" && featured.updatedAt
                      ? ` · ${formatDateFr(featured.updatedAt)}`
                      : ""}
                  </span>
                )}
              </div>
            </div>
          </section>
        )}
        <JournalFilters
          articles={rest.map((a) => articleCard(a, locale))}
          locale={locale}
        />
      </Container>
      {hubs.length > 0 && (
      <section className="bg-[#fbf8f3] py-14 md:py-16">
        <Container>
          <div className="text-center mb-9 md:mb-11">
            <div className="font-sans text-[10px] tracking-[0.24em] uppercase text-champagne mb-3">
              {c.hubsEyebrow}
            </div>
            <h2 className="font-serif text-[28px] md:text-[32px] text-ink">
              {c.hubsTitle}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {hubs.map((hub) => (
              <div key={hub.title.fr ?? hub.slugs[0]}>
                <div className="font-serif text-[18px] text-ink border-b border-[rgba(26,24,21,0.16)] pb-3 mb-3.5">
                  {hub.title[locale] ?? hub.title.fr}
                </div>
                <div className="grid gap-2.5">
                  {hub.slugs.map((slug) => {
                    const art = bySlug.get(slug);
                    return art ? (
                      <Link
                        key={slug}
                        href={localizedPath(`/${slug}`, locale)}
                        className="font-sans text-[14px] leading-snug text-warm-700 hover:text-ink transition-colors"
                      >
                        {articleCard(art, locale).title}
                      </Link>
                    ) : null;
                  })}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>
      )}
    </>
  );
}
