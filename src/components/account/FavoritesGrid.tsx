"use client";

import Link from "next/link";
import type { Product } from "@/lib/types";
import { useFavorites } from "@/lib/store/favorites";
import { useHasMounted } from "@/lib/useHasMounted";
import { ProductCard } from "@/components/product/ProductCard";
import { localizedPath, type Locale } from "@/lib/i18n";
import { t } from "@/lib/translations";

export function FavoritesGrid({ catalog, locale = "fr" }: { catalog: Product[]; locale?: Locale }) {
  const mounted = useHasMounted();
  const ids = useFavorites((s) => s.ids);
  const clear = useFavorites((s) => s.clear);
  const copy = t(locale);

  if (!mounted) return <div className="h-40" />;

  const products = catalog.filter((p) => ids.includes(p.id));

  if (products.length === 0) {
    return (
      <div className="bg-ivory-light border border-ink/10 rounded-md p-10 text-center">
        <p className="font-serif text-[22px] text-ink mb-3">
          {copy.account.emptyFavorites}
        </p>
        <p className="font-sans text-[14px] text-warm-500 mb-7">
          {copy.account.emptyFavoritesHelp}
        </p>
        <Link
          href={localizedPath("/boutique", locale)}
          className="font-sans text-[13px] uppercase tracking-[0.08em] text-ink border-b border-champagne pb-1 hover:text-champagne transition-colors"
        >
          {copy.cart.discoverShop}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-5">
        <button
          onClick={clear}
          className="font-sans text-[12px] text-warm-500 underline hover:text-champagne transition-colors cursor-pointer"
        >
          {copy.account.clearFavorites}
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} locale={locale} />
        ))}
      </div>
    </div>
  );
}
