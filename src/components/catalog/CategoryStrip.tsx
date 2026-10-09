import Link from "next/link";
import type { CategoryMeta } from "@/lib/types";
import { localizedPath, type Locale } from "@/lib/i18n";

/**
 * Rangée de liens vers les catégories, en tête de la boutique.
 *
 * Sans elle, les catégories n'étaient accessibles que par la sidebar (desktop)
 * ou derrière le bouton « Filtrer » (mobile) : avec 141 modèles dans la grille,
 * une cliente devait faire défiler des dizaines de pièces avant de soupçonner
 * qu'il existait des vestes. Ce sont de vrais liens (et non des filtres), donc
 * ils mènent aux pages catégorie indexées.
 */
export function CategoryStrip({
  categories,
  counts,
  /** Catégorie courante (sur une page catégorie) — affichée comme active. */
  activeSlug,
  locale = "fr",
}: {
  categories: CategoryMeta[];
  counts?: Record<string, number>;
  activeSlug?: string;
  locale?: Locale;
}) {
  if (categories.length < 2) return null;

  return (
    <nav
      aria-label={locale === "en" ? "Categories" : locale === "he" ? "קטגוריות" : "Catégories"}
      className="-mx-6 md:mx-0 px-6 md:px-0 mb-9 md:mb-11 overflow-x-auto"
    >
      <ul className="flex items-center gap-2.5 w-max md:w-auto md:flex-wrap">
        {categories.map((c) => {
          const n = counts?.[c.slug];
          const active = c.slug === activeSlug;
          return (
            <li key={c.slug}>
              <Link
                href={localizedPath(c.href, locale)}
                aria-current={active ? "page" : undefined}
                className={[
                  "inline-flex items-center gap-1.5 h-[39px] px-4 rounded-full font-sans text-[13px] whitespace-nowrap transition-colors",
                  active
                    ? "bg-ink text-white border border-ink"
                    : "bg-white text-[#3b362f] border border-[#dad4c9] hover:border-ink",
                ].join(" ")}
              >
                {c.name}
                {n ? (
                  <span
                    className={
                      active ? "text-white/55" : "text-[#9b9488]"
                    }
                  >
                    {n}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
