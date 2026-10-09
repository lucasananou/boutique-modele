"use client";

import { useRef } from "react";
import Link from "next/link";
import { ProductImage } from "@/components/ui/ProductImage";
import { localizedPath, type Locale } from "@/lib/i18n";
import { t, interpolate } from "@/lib/translations";
import { customerPhotos } from "@/data/testimonials";

/**
 * Carrousel des photos clientes.
 *
 * Un seul bloc, des visuels larges : une pièce portée en vrai convainc plus
 * qu'un pavé de texte. Les avis rédigés sont rattachés aux premières photos ;
 * les suivantes défilent en photo seule.
 *
 * Défilement natif (scroll-snap) plutôt qu'une librairie : le carrousel reste
 * utilisable au doigt, à la molette et au clavier, sans JavaScript
 * supplémentaire à charger.
 */
export function CustomerReviews({ locale = "fr" }: { locale?: Locale }) {
  const copy = t(locale).homePage.testimonials;
  const rail = useRef<HTMLUListElement>(null);
  const rtl = locale === "he";

  if (!customerPhotos.length) return null;

  const scrollByCard = (direction: 1 | -1) => {
    const el = rail.current;
    if (!el) return;
    // Un « pas » = la largeur d'une carte, pour retomber toujours sur un visuel.
    const card = el.firstElementChild as HTMLElement | null;
    const step = card ? card.offsetWidth + 20 : el.clientWidth * 0.8;
    el.scrollBy({ left: step * direction * (rtl ? -1 : 1), behavior: "smooth" });
  };

  return (
    // Rembourrage bas resserré : la FAQ qui suit apporte déjà le sien, et les
    // deux s'additionnaient (~380 px de vide sur ordinateur).
    <section className="pt-20 md:pt-24 pb-12 md:pb-14 overflow-hidden">
      <div className="px-6 md:px-16">
        <div className="max-w-[1240px] mx-auto flex items-end justify-between gap-6 mb-9 md:mb-11">
          <div>
            <div className="eyebrow mb-3.5">{copy.eyebrow}</div>
            <h2 className="font-serif font-medium text-[34px] md:text-[46px] leading-none text-ink">
              {copy.h2}
            </h2>
          </div>

          {/* Flèches : masquées au doigt, où l'on fait défiler directement. */}
          <div className="hidden md:flex gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              aria-label={copy.prev}
              className="w-11 h-11 rounded-full border border-sand-soft flex items-center justify-center text-ink hover:border-ink transition-colors cursor-pointer"
            >
              <Arrow dir={rtl ? "right" : "left"} />
            </button>
            <button
              type="button"
              onClick={() => scrollByCard(1)}
              aria-label={copy.next}
              className="w-11 h-11 rounded-full border border-sand-soft flex items-center justify-center text-ink hover:border-ink transition-colors cursor-pointer"
            >
              <Arrow dir={rtl ? "left" : "right"} />
            </button>
          </div>
        </div>
      </div>

      <ul
        ref={rail}
        className="flex gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth px-6 md:px-16 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {customerPhotos.map((media, i) => {
          const review = copy.items[i];
          const alt = review
            ? interpolate(copy.photoAlt, { name: review.name })
            : copy.galleryAlt;

          const visual = (
            <div className="relative aspect-[4/5] bg-sand overflow-hidden">
              <ProductImage
                src={media.image}
                alt={alt}
                className="transition-transform duration-700 group-hover:scale-[1.04]"
                sizes="(max-width: 640px) 78vw, (max-width: 1024px) 45vw, 340px"
              />
            </div>
          );

          return (
            <li
              key={media.image || i}
              className="group snap-start shrink-0 w-[78vw] sm:w-[45vw] lg:w-[340px]"
            >
              {media.productSlug ? (
                <Link
                  href={localizedPath(`/produit/${media.productSlug}`, locale)}
                  aria-label={alt}
                >
                  {visual}
                </Link>
              ) : (
                visual
              )}

              {review && (
                <div className="pt-5 flex flex-col gap-3">
                  <div
                    className="text-champagne tracking-[0.18em] text-[13px]"
                    aria-label={copy.rating}
                  >
                    <span aria-hidden="true">★★★★★</span>
                  </div>
                  <p className="font-serif text-[19px] leading-[1.45] text-ink m-0">
                    “{review.text}”
                  </p>
                  <div className="font-sans text-[13px] text-warm-500">
                    {review.name} · {copy.verified}
                  </div>
                </div>
              )}

              {media.productSlug && (
                <Link
                  href={localizedPath(`/produit/${media.productSlug}`, locale)}
                  className="mt-3 inline-block font-sans text-[12px] tracking-[0.12em] uppercase text-ink border-b border-champagne pb-1 hover:text-champagne transition-colors"
                >
                  {copy.viewPiece}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Arrow({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={dir === "left" ? { transform: "rotate(180deg)" } : undefined}
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
