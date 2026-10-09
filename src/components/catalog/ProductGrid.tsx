import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/product/ProductCard";
import { ButtonLink } from "@/components/ui/Button";
import { localizedPath, type Locale } from "@/lib/i18n";
import { t } from "@/lib/translations";

/** Classes de grille par nombre de colonnes desktop (défaut : 4, comportement historique). */
const COLUMN_CLASS: Record<3 | 4, string> = {
  4: "grid-cols-2 lg:grid-cols-4 gap-6 md:gap-7",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-[22px] gap-y-9",
};

export function ProductGrid({
  products,
  resetHref = "/boutique",
  columns = 4,
  locale = "fr",
}: {
  products: Product[];
  /** Lien de réinitialisation des filtres (conserve la catégorie de route). */
  resetHref?: string;
  /** Nombre de colonnes desktop. 4 = boutique (défaut) ; 3 = page catégorie (sidebar). */
  columns?: 3 | 4;
  locale?: Locale;
}) {
  const copy = t(locale).catalog;
  if (products.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="font-serif text-[26px] text-ink mb-3">
          {copy.emptyTitle}
        </p>
        <p className="font-sans text-[14px] leading-[1.7] text-warm-500 mb-8 max-w-[420px] mx-auto">
          {copy.emptyBody}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <ButtonLink href={localizedPath(resetHref, locale)} variant="solid">
          {copy.resetFilters}
          </ButtonLink>
          {resetHref !== "/boutique" && (
            <ButtonLink href={localizedPath("/boutique", locale)} variant="link">
              {copy.viewAllShop}
            </ButtonLink>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`grid ${COLUMN_CLASS[columns]}`}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} locale={locale} />
      ))}
    </div>
  );
}
