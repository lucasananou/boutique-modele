import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatPriceLocale } from "@/lib/format";
import { discountPercent } from "@/lib/productUtils";
import { localizedPath, type Locale } from "@/lib/i18n";
import { t } from "@/lib/translations";
import { ProductImage } from "@/components/ui/ProductImage";
import { QuickAddButton } from "./QuickAddButton";

/**
 * Vente additionnelle « souvent acheté avec ».
 *
 * Volontairement en lignes compactes et non en grille de cartes : le bloc vit
 * dans la colonne d'achat, juste sous le bouton, là où la décision se prend —
 * une grille y ajouterait un plein écran de défilement pour rien.
 */
export function BoughtTogether({
  products,
  locale = "fr",
}: {
  products: Product[];
  locale?: Locale;
}) {
  if (products.length === 0) return null;
  const copy = t(locale).product;

  return (
    <section className="mt-8 pt-7 border-t border-ink/10">
      <h2 className="font-serif text-[21px] leading-none text-ink mb-1.5">
        {copy.boughtTogether}
      </h2>
      <p className="font-sans text-[13px] text-warm-500 mb-5">
        {copy.boughtTogetherHint}
      </p>

      <ul className="flex flex-col">
        {products.map((p) => {
          const off = discountPercent(p.price, p.compareAtPrice);
          const image = p.images[0] ?? { src: "", alt: p.name };
          return (
            <li
              key={p.id}
              className="flex items-center gap-4 py-3.5 border-t border-sand-soft first:border-t-0 first:pt-0"
            >
              <Link
                href={localizedPath(`/produit/${p.slug}`, locale)}
                className="relative w-[62px] h-[82px] shrink-0 bg-sand rounded-sm overflow-hidden"
                tabIndex={-1}
                aria-hidden="true"
              >
                <ProductImage src={image.src} alt={image.alt} sizes="62px" />
              </Link>

              <div className="min-w-0 flex-1">
                <Link
                  href={localizedPath(`/produit/${p.slug}`, locale)}
                  className="font-serif text-[16px] leading-[1.25] text-ink hover:text-champagne transition-colors block"
                >
                  {p.name}
                </Link>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-sans text-[14px] text-champagne">
                    {formatPriceLocale(p.price, locale)}
                  </span>
                  {off > 0 && (
                    <span className="font-sans text-[12px] text-warm-300 line-through">
                      {formatPriceLocale(p.compareAtPrice!, locale)}
                    </span>
                  )}
                </div>
              </div>

              <div className="shrink-0">
                <QuickAddButton product={p} locale={locale} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
