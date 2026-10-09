"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Product, CategoryMeta } from "@/lib/types";
import { ProductCard } from "@/components/product/ProductCard";
import { SearchIcon } from "@/components/ui/icons";
import { localizedPath, type Locale } from "@/lib/i18n";
import { t } from "@/lib/translations";

export function SearchClient({
  products,
  categories,
  locale = "fr",
}: {
  products: Product[];
  categories: CategoryMeta[];
  locale?: Locale;
}) {
  const [q, setQ] = useState("");
  const copy = t(locale);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return products.filter((p) => {
      const haystack = [
        p.name,
        p.materialLabel,
        p.collectionName,
        p.categoryName,
        p.shortDescription,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [q, products]);

  return (
    <div className="px-6 md:px-16 py-12 md:py-16 min-h-[60vh]">
      <header className="text-center mb-10">
        <div className="eyebrow mb-4">{copy.search.eyebrow}</div>
        <h1 className="font-serif font-normal text-[36px] md:text-[48px] text-ink">
          {copy.search.title}
        </h1>
      </header>

      <div className="max-w-[560px] mx-auto mb-14">
        <div className="flex items-center gap-3 border-b border-ink/20 pb-3 focus-within:border-champagne transition-colors">
          <SearchIcon className="text-warm-500" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={copy.search.placeholder}
            className="flex-1 bg-transparent outline-none font-sans text-[16px] text-ink placeholder:text-warm-300"
          />
        </div>
      </div>

      {q.trim() && (
        <p className="font-sans text-[13px] text-warm-500 text-center mb-8">
          {results.length} {results.length > 1 ? copy.search.results : copy.search.result} {copy.search.for} « {q} »
        </p>
      )}

      {results.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-7">
          {results.map((p) => (
            <ProductCard key={p.id} product={p} locale={locale} />
          ))}
        </div>
      ) : (
        <div className="text-center">
          {q.trim() ? (
            <p className="font-sans text-[15px] text-warm-500 mb-10">
              {copy.search.empty}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
            <span className="eyebrow self-center">{copy.search.explore}</span>
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={localizedPath(c.href, locale)}
                className="font-sans text-[14px] text-warm-700 hover:text-champagne transition-colors"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
