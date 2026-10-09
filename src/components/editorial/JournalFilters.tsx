"use client";

import { useState } from "react";
import Link from "next/link";
import { ProductImage } from "@/components/ui/ProductImage";
import { localizedPath, type Locale } from "@/lib/i18n";

export interface JournalCard {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  image: string;
}

/**
 * Filtres par catégorie + grille filtrée du Journal. Les catégories existaient
 * déjà mais n'étaient pas cliquables : 22 articles en liste plate deviennent
 * parcourables (découverte + maillage).
 */
const copy = {
  fr: {
    all: "Tous",
    article: "article",
    plural: "s",
    read: "Lire l'article ->",
  },
  en: { all: "All", article: "article", plural: "s", read: "Read article ->" },
  he: { all: "הכול", article: "מאמר", plural: "ים", read: "לקריאת המאמר ->" },
} satisfies Record<
  Locale,
  { all: string; article: string; plural: string; read: string }
>;

export function JournalFilters({
  articles,
  locale = "fr",
}: {
  articles: JournalCard[];
  locale?: Locale;
}) {
  const c = copy[locale];
  const categories = [
    c.all,
    ...Array.from(new Set(articles.map((a) => a.category))),
  ];
  const [active, setActive] = useState(c.all);
  const shown =
    active === c.all ? articles : articles.filter((a) => a.category === active);

  return (
    <>
      <div className="flex gap-x-6 gap-y-3 justify-center flex-wrap border-b border-[rgba(26,24,21,0.1)] pb-6">
        {categories.map((c) => {
          const on = c === active;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setActive(c)}
              className={[
                "font-sans text-[12px] tracking-[0.14em] uppercase pb-2 border-b cursor-pointer transition-colors",
                on
                  ? "text-ink border-champagne"
                  : "text-warm-500 border-transparent hover:text-ink",
              ].join(" ")}
            >
              {c}
            </button>
          );
        })}
      </div>

      <div className="font-sans text-[11px] tracking-[0.2em] uppercase text-warm-500 mt-6 mb-8">
        {shown.length} {c.article}
        {shown.length > 1 ? c.plural : ""}
        {active !== c.all ? ` · ${active}` : ""}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
        {shown.map((a) => (
          <article key={a.slug} className="group">
            <Link href={localizedPath(`/${a.slug}`, locale)} className="block">
              <div className="relative aspect-[4/5] rounded-md overflow-hidden mb-4 bg-sand">
                <ProductImage
                  src={a.image}
                  alt={a.title}
                  className="transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
            </Link>
            <div className="font-sans text-[10px] tracking-[0.2em] uppercase text-champagne mb-2.5">
              {a.category}
            </div>
            <h3 className="font-serif text-[22px] md:text-[23px] leading-[1.22] text-ink mb-2">
              <Link
                href={localizedPath(`/${a.slug}`, locale)}
                className="hover:text-champagne transition-colors"
              >
                {a.title}
              </Link>
            </h3>
            <p className="font-sans text-[14px] leading-[1.65] text-warm-700 mb-3">
              {a.excerpt}
            </p>
            <Link
              href={localizedPath(`/${a.slug}`, locale)}
              className="font-sans text-[11px] tracking-[0.16em] uppercase text-ink border-b border-champagne pb-1 hover:text-champagne transition-colors"
            >
              {c.read}
            </Link>
          </article>
        ))}
      </div>
    </>
  );
}
