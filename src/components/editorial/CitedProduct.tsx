import Link from "next/link";
import type { Category } from "@/lib/types";
import { ProductImage } from "@/components/ui/ProductImage";
import { formatPriceLocale } from "@/lib/format";
import { localizedPath, type Locale } from "@/lib/i18n";
import {
  getEditorialByCategory,
  getEditorialBySlug,
} from "@/lib/editorialProducts";

const copy: Record<Locale, { label: string; view: string }> = {
  fr: { label: "En boutique", view: "Voir la pièce →" },
  en: { label: "In the shop", view: "View the piece →" },
  he: { label: "בחנות", view: "לצפייה בפריט ←" },
};

/**
 * Note de marge produit, glissée entre deux paragraphes d'un article.
 * Résout une vraie pièce (par slug curaté, sinon première pièce en stock de la
 * catégorie). Ne rend rien si aucune pièce ne correspond → l'article reste intact.
 */
export async function CitedProduct({
  slug,
  category,
  match,
  label,
  locale = "fr",
}: {
  slug?: string;
  category?: Category;
  /** Préférer une pièce dont le nom/tissu contient ce terme (ex. "jean"). */
  match?: string;
  label?: string;
  locale?: Locale;
}) {
  const product = slug
    ? await getEditorialBySlug(slug, locale)
    : category
      ? await getEditorialByCategory(category, match, locale)
      : null;
  if (!product) return null;
  const text = copy[locale];

  return (
    <span className="article-embed block my-7">
      <Link
        href={localizedPath(`/produit/${product.slug}`, locale)}
        className="group flex items-center gap-4 py-3.5 border-y border-[rgba(26,24,21,0.12)]"
      >
        <span className="relative block w-[54px] shrink-0 aspect-[3/4] bg-sand overflow-hidden">
          <ProductImage
            src={product.image.src}
            alt={product.image.alt}
            sizes="54px"
          />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-sans text-[10px] tracking-[0.2em] uppercase text-champagne mb-1.5">
            {label ?? text.label}
          </span>
          <span className="block font-sans text-[15px] text-ink leading-snug">
            {product.name}
            <span className="text-warm-700"> — {formatPriceLocale(product.price, locale)}</span>
          </span>
        </span>
        <span className="font-sans text-[11px] tracking-[0.14em] uppercase text-ink border-b border-ink pb-[5px] whitespace-nowrap transition-colors group-hover:text-champagne group-hover:border-champagne">
          {text.view}
        </span>
      </Link>
    </span>
  );
}
