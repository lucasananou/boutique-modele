"use client";

import Link from "next/link";
import { ProductImage } from "@/components/ui/ProductImage";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/lib/store/cart";
import type { EditorialProduct } from "@/lib/editorialProducts";

/**
 * « La tenue de l'article » : quatre vraies pièces + ajout groupé au panier.
 * Les pièces à tailles renvoient vers la fiche (choix de taille obligatoire) ;
 * les pièces sans variante sont ajoutées directement, seules ou en un clic.
 */
export function ArticleOutfit({
  title,
  products,
}: {
  title: string;
  products: EditorialProduct[];
}) {
  const add = useCart((s) => s.add);
  if (!products.length) return null;

  const addOne = (p: EditorialProduct) =>
    add({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      materialLabel: p.materialLabel,
      unitPrice: p.price,
      image: p.image,
    });

  const addable = products.filter((p) => p.inStock && !p.hasVariants);
  const addableTotal = addable.reduce((s, p) => s + p.price, 0);

  return (
    <section className="bg-[#fbf8f3] p-7 md:p-9 my-12">
      <div className="font-sans text-[10px] tracking-[0.22em] uppercase text-champagne mb-3.5">
        La tenue de l&apos;article
      </div>
      <h2 className="font-serif text-[26px] md:text-[28px] leading-tight text-ink mb-6">
        {title}
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
        {products.map((p) => (
          <div key={p.id}>
            <Link
              href={`/produit/${p.slug}`}
              className="relative block aspect-[3/4] bg-sand overflow-hidden mb-3"
            >
              <ProductImage
                src={p.image.src}
                alt={p.image.alt}
                sizes="(max-width: 768px) 45vw, 22vw"
              />
            </Link>
            <Link
              href={`/produit/${p.slug}`}
              className="block font-sans text-[14px] text-ink leading-snug mb-1 hover:text-champagne transition-colors"
            >
              {p.name}
            </Link>
            <div className="font-sans text-[13px] text-warm-700 mb-2">
              {formatPrice(p.price)}
            </div>
            {!p.inStock ? (
              <span className="font-sans text-[11px] tracking-[0.1em] uppercase text-warm-500">
                Épuisé
              </span>
            ) : p.hasVariants ? (
              <Link
                href={`/produit/${p.slug}`}
                className="font-sans text-[11px] tracking-[0.1em] uppercase text-ink border-b border-champagne pb-[3px] hover:text-champagne transition-colors"
              >
                Choisir →
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => addOne(p)}
                className="font-sans text-[11px] tracking-[0.1em] uppercase text-ink border-b border-champagne pb-[3px] hover:text-champagne transition-colors cursor-pointer"
              >
                Ajouter →
              </button>
            )}
          </div>
        ))}
      </div>

      {addable.length > 1 && (
        <div className="flex items-center gap-4 flex-wrap mt-7">
          <button
            type="button"
            onClick={() => addable.forEach(addOne)}
            className="bg-ink text-white font-sans text-[11px] tracking-[0.16em] uppercase px-6 py-4 hover:bg-champagne transition-colors cursor-pointer"
          >
            Ajouter {addable.length === products.length
              ? `les ${addable.length} pièces`
              : `${addable.length} pièces`}{" "}
            — {formatPrice(addableTotal)}
          </button>
          <span className="font-sans text-[13px] text-warm-700">
            Ajout direct au panier
          </span>
        </div>
      )}
    </section>
  );
}
