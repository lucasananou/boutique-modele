import Link from "next/link";
import { getCategories } from "@/lib/taxonomy";
import { getCategoryCounts, getIconicProducts } from "@/lib/products";
import type { ActiveFlashSale } from "@/lib/flashSale";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductImage } from "@/components/ui/ProductImage";
import { Countdown } from "@/components/ui/Countdown";
import { Container } from "@/components/ui/Container";
import { localizedPath, type Locale } from "@/lib/i18n";
import { t, interpolate } from "@/lib/translations";

/* ===== BANDEAU RÉASSURANCE ===== */
export function Reassurance({ locale = "fr" }: { locale?: Locale }) {
  const items = t(locale).homePage.reassurance;
  return (
    <section className="border-y border-sand-soft bg-ivory-light">
      <Container className="px-0 md:px-0">
      <div className="grid grid-cols-2 lg:grid-cols-4">
        {items.map((r, i) => (
          <div
            key={r.t}
            className={[
              "px-6 py-7 flex flex-col gap-1.5",
              i % 2 !== 0 ? "border-l border-sand-soft" : "",
              i >= 2 ? "border-t lg:border-t-0 border-sand-soft" : "",
              i !== 0 ? "lg:border-l lg:border-sand-soft" : "",
            ].join(" ")}
          >
            <div className="font-sans text-[12px] tracking-[0.2em] uppercase text-champagne">
              {String(i + 1).padStart(2, "0")}
            </div>
            <div className="font-serif text-[21px] text-ink">{r.t}</div>
            <div className="font-sans text-[13px] leading-[1.5] text-warm-500">
              {r.d}
            </div>
          </div>
        ))}
      </div>
      </Container>
    </section>
  );
}

/* ===== PAR CATÉGORIE ===== */
export async function Categories({ locale = "fr" }: { locale?: Locale }) {
  const copy = t(locale).homePage.categories;
  const cats = await getCategories(locale);
  const counts = await getCategoryCounts();
  return (
    <section className="pt-20 md:pt-24 pb-10">
      <Container>
      <div className="flex items-end justify-between mb-10 md:mb-11">
        <div>
          <div className="eyebrow mb-3.5">{copy.eyebrow}</div>
          <h2 className="font-serif font-medium text-[34px] md:text-[46px] leading-none text-ink">
            {copy.h2}
          </h2>
        </div>
        <Link
          href={localizedPath("/boutique", locale)}
          className="font-sans text-[13px] tracking-[0.12em] uppercase text-ink border-b border-ink pb-1 hover:text-champagne hover:border-champagne transition-colors whitespace-nowrap"
        >
          {copy.all}
        </Link>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {cats.map((cat) => (
          <Link
            key={cat.slug}
            href={localizedPath(cat.href, locale)}
            className="group relative block aspect-[4/5] overflow-hidden bg-sand"
          >
            <ProductImage
              src={cat.image.src}
              alt={cat.image.alt}
              className="transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgba(22,19,15,0.5), rgba(22,19,15,0) 55%)",
              }}
            />
            <div className="absolute left-6 bottom-5 text-white">
              <div className="font-serif text-[26px] leading-none">
                {cat.name}
              </div>
              <div className="font-sans text-[12px] tracking-[0.16em] uppercase opacity-85 mt-1.5">
                {interpolate(copy.models, { count: counts[cat.slug] ?? 0 })}
              </div>
            </div>
          </Link>
        ))}
        {/* Carte Nouveautés */}
        <Link
          href={localizedPath("/boutique?tri=nouveautes", locale)}
          className="bg-ink text-ink-soft p-8 flex flex-col justify-between aspect-[4/5]"
        >
          <div className="font-sans text-[12px] tracking-[0.26em] uppercase text-champagne-pale">
            {copy.newEyebrow}
          </div>
          <div>
            <div className="font-serif text-[30px] leading-[1.05] mb-4">
              {copy.newTitle}
            </div>
            <span className="font-sans text-[13px] tracking-[0.14em] uppercase border-b border-ink-soft pb-1">
              {copy.newCta}
            </span>
          </div>
        </Link>
      </div>
      </Container>
    </section>
  );
}

/* ===== VENTES FLASH + COUNTDOWN + MEILLEURES VENTES ===== */
export async function FlashBestsellers({
  flashSale,
  locale = "fr",
}: {
  flashSale: ActiveFlashSale | null;
  locale?: Locale;
}) {
  const copy = t(locale).homePage.bestsellers;
  const items = await getIconicProducts(4, locale);
  return (
    <section className="py-16 md:py-20">
      <Container>
      <div className="flex items-center justify-between flex-wrap gap-6 mb-10 px-7 py-6 bg-ivory-light border border-sand-soft">
        <div>
          <div className="font-sans text-[12px] tracking-[0.3em] uppercase text-champagne mb-2">
            {flashSale
              ? `${flashSale.label} · −${flashSale.percent}%`
              : copy.fallbackEyebrow}
          </div>
          <h2 className="font-serif font-medium text-[32px] md:text-[36px] leading-none text-ink">
            {copy.h2}
          </h2>
        </div>
        {flashSale ? (
          <div className="flex items-center gap-4">
            <span className="font-sans text-[12px] tracking-[0.14em] uppercase text-warm-500">
              {copy.endsIn}
            </span>
            <Countdown endsAt={flashSale.endsAt} />
          </div>
        ) : null}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-5">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      </Container>
    </section>
  );
}

/* ===== BANDE ENGAGEMENTS (désactivable : store.sections.valuesBand) ===== */
export function ValuesBand({ locale = "fr" }: { locale?: Locale }) {
  const copy = t(locale).homePage.values;
  return (
    <section className="bg-ink text-ink-soft">
      <Container className="py-20 md:py-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
        <div>
          <div className="font-sans text-[12px] tracking-[0.32em] uppercase text-champagne-pale mb-6">
            {copy.eyebrow}
          </div>
          <h2 className="font-serif font-medium text-[38px] md:text-[48px] leading-[1.08] text-ivory mb-6">
            {copy.h2}
          </h2>
          <p className="font-sans text-[16px] leading-[1.8] text-warm-300 max-w-[480px] mb-4">
            {copy.p1}
          </p>
          <p className="font-sans text-[16px] leading-[1.8] text-warm-300 max-w-[480px]">
            {copy.p2}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-7">
          {copy.items.map((v) => (
            <div
              key={v.t}
              className="border-t border-ink-soft/25 pt-4.5"
              style={{ paddingTop: "1.1rem" }}
            >
              <div
                aria-hidden="true"
                className="font-serif text-[38px] leading-none text-champagne-light"
              >
                ✦
              </div>
              <div className="font-sans text-[15px] mt-3 mb-1.5">{v.t}</div>
              <div className="font-sans text-[13px] leading-[1.6] text-warm-300">
                {v.d}
              </div>
            </div>
          ))}
        </div>
      </div>
      </Container>
    </section>
  );
}

