"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";

const copy: Record<Locale, { title: string; intro: string }> = {
  fr: {
    title: "Questions fréquentes",
    intro: "Les réponses courtes aux questions les plus posées.",
  },
  en: {
    title: "Frequently asked questions",
    intro: "Short answers to the most common questions.",
  },
  he: {
    title: "שאלות נפוצות",
    intro: "תשובות קצרות לשאלות הנפוצות ביותר.",
  },
};

/**
 * FAQ en accordéon. Le balisage FAQPage (rich snippet) est injecté séparément
 * en JSON-LD par le layout — ici, seul le rendu visible interactif.
 */
export function ArticleFaq({
  items,
  locale = "fr",
}: {
  items: { q: string; a: string }[];
  locale?: Locale;
}) {
  const [open, setOpen] = useState(0);
  if (!items.length) return null;

  return (
    <section className="my-12">
      <h2 className="font-serif text-[26px] md:text-[30px] leading-tight text-ink mb-1">
        {copy[locale].title}
      </h2>
      <p className="font-sans text-[12px] leading-relaxed text-warm-500 mb-4">
        {copy[locale].intro}
      </p>
      <div className="border-t border-[rgba(26,24,21,0.14)]">
        {items.map((f, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className="border-b border-[rgba(26,24,21,0.14)]">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="w-full flex justify-between items-baseline gap-5 py-5 text-left cursor-pointer"
              >
                <span className="font-serif text-[19px] md:text-[20px] leading-snug text-ink">
                  {f.q}
                </span>
                <span className="font-sans text-[18px] text-champagne shrink-0 leading-none">
                  {isOpen ? "−" : "+"}
                </span>
              </button>
              {isOpen && (
                <p className="font-sans text-[15.5px] leading-[1.75] text-warm-700 pb-5 -mt-1 max-w-[660px]">
                  {f.a}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
