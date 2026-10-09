"use client";

import { useId } from "react";
import type { CategoryMeta, MaterialMeta, Collection } from "@/lib/types";
import type { FacetCounts } from "@/lib/catalog";
import { useCatalogParams } from "./useCatalogParams";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/translations";

// Échelle de tailles standard (id de variante → libellé). Les variantes hors
// échelle (couleurs importées, « taille unique »…) ne sont pas proposées ici.
const SIZE_LADDER: [string, string][] = [
  ["xs", "XS"],
  ["s", "S"],
  ["m", "M"],
  ["l", "L"],
  ["xl", "XL"],
  ["xxl", "XXL"],
  ["xxxl", "XXXL"],
  ["4xl", "4XL"],
  ["5xl", "5XL"],
];

interface Props {
  categories: CategoryMeta[];
  materials: MaterialMeta[];
  collections: Collection[];
  /** Comptes par facette (cache les options à 0 et affiche le nombre). */
  counts?: FacetCounts;
  /** Sur une page catégorie, la catégorie vient de la route → on masque ce filtre. */
  lockedCategory?: boolean;
  /** Masque le tri (quand il est déjà affiché ailleurs, ex. barre catalogue). */
  hideSort?: boolean;
  /** Affiche l'en-tête « Filtrer / Réinitialiser » (sidebar desktop). Le tiroir
   *  mobile a déjà son propre en-tête → il ne le passe pas. */
  showHeader?: boolean;
  /** Affiche le bloc réassurance en bas (sidebar). */
  showReassurance?: boolean;
  locale?: Locale;
}

export function FilterControls({
  categories,
  materials,
  collections,
  counts,
  lockedCategory = false,
  hideSort = false,
  showHeader = false,
  showReassurance = false,
  locale = "fr",
}: Props) {
  const { get, toggleParam, setParam, clearAll } = useCatalogParams();
  const copy = t(locale);
  const sorts = [
    { value: "", label: copy.catalog.recommended },
    { value: "nouveautes", label: copy.catalog.newArrivals },
    { value: "prix-asc", label: copy.catalog.priceAsc },
    { value: "prix-desc", label: copy.catalog.priceDesc },
  ];

  const activeCat = get("categorie");
  const activeMat = get("matiere");
  const activeCol = get("collection");
  const activeSize = get("taille");
  const activeSort = get("tri");
  const dispoOn = get("dispo") === "en-stock";

  // Option visible ? (si on a les comptes, on cache celles à 0)
  const visible = (n: number | undefined) => !counts || (n ?? 0) > 0;

  const sizes = SIZE_LADDER.filter(
    ([id]) => !counts || (counts.taille[id] ?? 0) > 0,
  );

  return (
    <div className="font-sans">
      {showHeader && (
        <div className="flex items-baseline justify-between mb-7">
          <h2 className="font-serif font-medium text-[26px] leading-none text-ink">
            {copy.catalog.filter}
          </h2>
          <button
            type="button"
            onClick={clearAll}
            className="font-sans text-[12px] text-champagne hover:text-ink transition-colors cursor-pointer"
          >
            {copy.common.reset}
          </button>
        </div>
      )}

      {!lockedCategory && (
        <Section label={copy.catalog.category} first={showHeader}>
          <CheckRow
            checked={!activeCat}
            onClick={() => setParam("categorie", null)}
          >
            {copy.catalog.allCategories}
          </CheckRow>
          {categories
            .filter((c) => visible(counts?.categorie[c.slug]))
            .map((c) => (
              <CheckRow
                key={c.slug}
                checked={activeCat === c.slug}
                count={counts?.categorie[c.slug]}
                onClick={() => toggleParam("categorie", c.slug)}
              >
                {c.name}
              </CheckRow>
            ))}
        </Section>
      )}

      {/* MATIÈRE (materials) */}
      <Section label={copy.catalog.material} first={showHeader && lockedCategory}>
        {materials
          .filter((m) => visible(counts?.matiere[m.slug]))
          .map((m) => (
            <CheckRow
              key={m.slug}
              checked={activeMat === m.slug}
              count={counts?.matiere[m.slug]}
              onClick={() => toggleParam("matiere", m.slug)}
            >
              {m.name}
            </CheckRow>
          ))}
      </Section>

      {/* OCCASION (collections) */}
      <Section label={copy.catalog.occasion}>
        {collections
          .filter((c) => visible(counts?.collection[c.slug]))
          .map((c) => (
            <CheckRow
              key={c.slug}
              checked={activeCol === c.slug}
              count={counts?.collection[c.slug]}
              onClick={() => toggleParam("collection", c.slug)}
            >
              {c.name}
            </CheckRow>
          ))}
      </Section>

      {/* TAILLE — grille de chips qui wrap */}
      {sizes.length > 0 && (
        <Section label={copy.catalog.size}>
          <div className="flex flex-wrap gap-2">
            {sizes.map(([id, label]) => {
              const on = activeSize === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleParam("taille", id)}
                  aria-pressed={on}
                  className={[
                    "inline-flex items-center justify-center min-w-[44px] h-[44px] px-2 rounded-md border font-sans text-[13px] transition-colors cursor-pointer",
                    on
                      ? "bg-ink text-white border-ink"
                      : "bg-transparent text-ink border-sand-soft hover:border-ink",
                  ].join(" ")}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </Section>
      )}

      <PriceSection locale={locale} />

      {/* DISPONIBILITÉ */}
      <Section label={copy.catalog.availability}>
        <CheckRow
          checked={dispoOn}
          onClick={() => setParam("dispo", dispoOn ? null : "en-stock")}
        >
          {copy.catalog.inStockOnly}
        </CheckRow>
      </Section>

      {!hideSort && (
        <Section label={copy.catalog.sort}>
          <select
            aria-label={copy.catalog.sortProducts}
            value={activeSort}
            onChange={(e) => setParam("tri", e.target.value || null)}
            className="w-full font-sans text-[13px] text-ink bg-transparent border border-sand-soft rounded-xs px-3 min-h-[44px] cursor-pointer focus:border-champagne outline-none"
          >
            {sorts.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Section>
      )}

      {showReassurance && <Reassurance locale={locale} />}
    </div>
  );
}

/* ---------- Prix (deux champs min/max, plus accessibles qu'un slider) ---------- */
function PriceSection({ locale }: { locale: Locale }) {
  const { get, setParam } = useCatalogParams();
  const copy = t(locale);
  const urlMin = get("prix-min");
  const urlMax = get("prix-max");
  const minId = useId();
  const maxId = useId();

  const sanitize = (e: React.FormEvent<HTMLInputElement>) => {
    e.currentTarget.value = e.currentTarget.value.replace(/[^\d]/g, "");
  };
  const inputClass =
    "w-full font-sans text-[13px] text-ink bg-transparent border border-sand-soft rounded-xs pl-3 pr-6 min-h-[44px] focus:border-champagne outline-none";

  return (
    <Section label={copy.catalog.price}>
      <div className="flex items-center gap-2.5">
        <div className="relative flex-1">
          <label htmlFor={minId} className="sr-only">
            {copy.catalog.minPrice}
          </label>
          <input
            id={minId}
            key={`min-${urlMin}`}
            inputMode="numeric"
            placeholder="Min"
            defaultValue={urlMin}
            onInput={sanitize}
            onBlur={(e) => setParam("prix-min", e.currentTarget.value || null)}
            onKeyDown={(e) => {
              if (e.key === "Enter")
                setParam("prix-min", e.currentTarget.value || null);
            }}
            className={inputClass}
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-warm-500 text-[13px] pointer-events-none">
            €
          </span>
        </div>
        <span className="text-warm-500 text-[13px]" aria-hidden>
          —
        </span>
        <div className="relative flex-1">
          <label htmlFor={maxId} className="sr-only">
            {copy.catalog.maxPrice}
          </label>
          <input
            id={maxId}
            key={`max-${urlMax}`}
            inputMode="numeric"
            placeholder="Max"
            defaultValue={urlMax}
            onInput={sanitize}
            onBlur={(e) => setParam("prix-max", e.currentTarget.value || null)}
            onKeyDown={(e) => {
              if (e.key === "Enter")
                setParam("prix-max", e.currentTarget.value || null);
            }}
            className={inputClass}
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-warm-500 text-[13px] pointer-events-none">
            €
          </span>
        </div>
      </div>
    </Section>
  );
}

/* ---------- Bloc réassurance (bas de sidebar) ---------- */
function Reassurance({ locale }: { locale: Locale }) {
  const copy = t(locale);
  return (
    <div className="mt-8 pt-6 border-t border-sand-soft flex flex-col gap-3.5">
      <ReassuranceLine text={copy.catalog.reassurance1}>
        <TruckIcon />
      </ReassuranceLine>
      <ReassuranceLine text={copy.catalog.reassurance2}>
        <ReturnIcon />
      </ReassuranceLine>
      <ReassuranceLine text={copy.catalog.reassurance3}>
        <CardIcon />
      </ReassuranceLine>
    </div>
  );
}

function ReassuranceLine({
  text,
  children,
}: {
  text: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 font-sans text-[12.5px] text-warm-700">
      <span className="text-[#7c766c] shrink-0" aria-hidden>
        {children}
      </span>
      {text}
    </div>
  );
}

/* ---------- Primitives ---------- */
function Section({
  label,
  first = false,
  children,
}: {
  label: string;
  /** Première section : pas de filet supérieur (l'en-tête fait office de séparation). */
  first?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={
        first ? "py-6 first:pt-0" : "py-6 border-t border-sand-soft first:pt-0"
      }
    >
      <h3 className="font-sans text-[11px] tracking-[0.14em] uppercase text-[#9b9488] mb-3.5">
        {label}
      </h3>
      <div className="flex flex-col gap-2.5">{children}</div>
    </section>
  );
}

/** Ligne « case + libellé + compteur » entièrement cliquable. */
function CheckRow({
  checked,
  onClick,
  count,
  children,
}: {
  checked: boolean;
  onClick: () => void;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group min-h-[24px]">
      <input
        type="checkbox"
        checked={checked}
        onChange={onClick}
        className="sr-only"
      />
      <span
        aria-hidden
        className={[
          "inline-flex items-center justify-center w-[17px] h-[17px] shrink-0 rounded-[4px] border transition-colors",
          checked
            ? "bg-ink border-ink text-white"
            : "border-[#c9c1b3] group-hover:border-ink",
        ].join(" ")}
      >
        {checked && (
          <svg
            width="10"
            height="10"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2.5 6.5l2.5 2.5 4.5-5" />
          </svg>
        )}
      </span>
      <span
        className={[
          "flex-1 font-sans text-[14px] transition-colors",
          checked ? "text-ink" : "text-warm-700 group-hover:text-ink",
        ].join(" ")}
      >
        {children}
      </span>
      {typeof count === "number" && (
        <span className="font-sans text-[13px] text-[#b0a08a] tabular-nums">
          {count}
        </span>
      )}
    </label>
  );
}

/* ---------- Icônes réassurance ---------- */
function TruckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 6h11v9H3zM14 9h4l3 3v3h-7z" />
      <circle cx="7" cy="18" r="1.6" />
      <circle cx="17.5" cy="18" r="1.6" />
    </svg>
  );
}

function ReturnIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 10a7 7 0 1 1 1.5 4.3" />
      <path d="M4 5v5h5" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="2.5" y="5.5" width="19" height="13" rx="2" />
      <path d="M2.5 9.5h19" />
      <path d="M6 14.5h4" />
    </svg>
  );
}
