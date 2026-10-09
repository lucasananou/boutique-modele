import Link from "next/link";
import { ProductImage } from "@/components/ui/ProductImage";
import { formatPrice } from "@/lib/format";
import type { EditorialProduct } from "@/lib/editorialProducts";

/**
 * Colonne de droite collante « Les pièces citées » : deux pièces réelles
 * visibles pendant toute la lecture. Masquée sous lg (place à la « tenue de
 * l'article » et aux notes de marge sur mobile).
 */
export function StickyProductRail({
  products,
}: {
  products: EditorialProduct[];
}) {
  if (!products.length) return null;

  return (
    <aside className="hidden lg:block sticky top-7 self-start">
      <div className="font-sans text-[10px] tracking-[0.22em] uppercase text-champagne mb-4">
        Les pièces citées
      </div>
      <div className="grid gap-5">
        {products.map((p) => (
          <Link key={p.id} href={`/produit/${p.slug}`} className="group block">
            <div className="relative aspect-[3/4] bg-sand overflow-hidden mb-2.5">
              <ProductImage
                src={p.image.src}
                alt={p.image.alt}
                sizes="220px"
              />
            </div>
            <div className="font-sans text-[13px] text-ink leading-snug group-hover:text-champagne transition-colors">
              {p.name}
            </div>
            <div className="font-sans text-[12px] text-warm-700 mt-1">
              {formatPrice(p.price)}
            </div>
          </Link>
        ))}
      </div>
      <Link
        href="/boutique"
        className="block text-center border border-ink font-sans text-[10px] tracking-[0.16em] uppercase py-3 mt-5 hover:bg-ink hover:text-white transition-colors"
      >
        Voir la sélection
      </Link>
      <div className="font-sans text-[11px] text-warm-500 text-center mt-2.5">
        Retour gratuit 30 jours
      </div>
    </aside>
  );
}
