"use client";

import { useState } from "react";
import Link from "next/link";
import type { CategoryMeta, MaterialMeta, Collection } from "@/lib/types";
import type { FacetCounts } from "@/lib/catalog";
import { useCatalogParams } from "./useCatalogParams";
import { FilterControls } from "./FilterControls";
import { FilterDrawer } from "./FilterDrawer";
import type { Locale } from "@/lib/i18n";
import { localizedPath } from "@/lib/i18n";
import { interpolate, t } from "@/lib/translations";

/**
 * Un preset de la rangée de chips « filtres rapides ». Chaque preset câble une
 * ou plusieurs clés de filtre de l'URL (via useCatalogParams). `params` liste
 * les couples clé/valeur à poser ; un preset est ACTIF quand toutes ses clés
 * portent exactement ses valeurs.
 */
interface QuickFilter {
  id: string;
  label: string;
  params: [string, string][];
}

interface Props {
  categories: CategoryMeta[];
  materials: MaterialMeta[];
  collections: Collection[];
  counts?: FacetCounts;
  /** Nombre total de résultats filtrés (toutes pages confondues). */
  resultCount: number;
  /** Nombre de modèles visibles jusqu'ici : min(page × pageSize, resultCount). */
  shownCount: number;
  /** Chips de filtres rapides pré-calculés côté serveur (données réelles). */
  quickFilters: QuickFilter[];
  /** Contrôles de pagination (server component, liens) rendus sous la grille. */
  pagination?: React.ReactNode;
  /** Grille produits (server component) injectée en enfant. */
  children: React.ReactNode;
  locale?: Locale;
}

/**
 * Orchestration client de la page catégorie : rangée de chips rapides,
 * sidebar de filtres inline (desktop), barre d'outils (compteur + tri + bouton
 * mobile) et tiroir mobile. Toute la sélection vit dans l'URL ; la grille reste
 * rendue côté serveur et passée en `children`.
 */
export function CategoryLayout({
  categories,
  materials,
  collections,
  counts,
  resultCount,
  shownCount,
  quickFilters,
  pagination,
  children,
  locale = "fr",
}: Props) {
  const { get, setParam, setMany } = useCatalogParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const copy = t(locale);
  const sortOptions = [
    { value: "", label: copy.catalog.recommended },
    { value: "nouveautes", label: copy.catalog.newArrivals },
    { value: "prix-asc", label: copy.catalog.priceAsc },
    { value: "prix-desc", label: copy.catalog.priceDesc },
  ];

  // Clés pilotées par les chips rapides : « Tout » les réinitialise toutes.
  const quickKeys = Array.from(
    new Set(quickFilters.flatMap((q) => q.params.map(([k]) => k))),
  );

  const isQuickActive = (q: QuickFilter) =>
    q.params.every(([k, v]) => get(k) === v);

  const anyQuickActive = quickFilters.some(isQuickActive);

  // Pose un preset (en remplaçant les autres presets rapides, mutuellement
  // exclusifs) ; re-cliquer un preset actif le retire. Une seule navigation.
  function applyQuick(q: QuickFilter) {
    if (isQuickActive(q)) {
      const cleared: [string, string | null][] = q.params.map(([k]) => [
        k,
        null,
      ]);
      setMany(cleared, []);
      return;
    }
    setMany(q.params, quickKeys);
  }

  // « Tout » : réinitialise uniquement les clés des chips rapides (garde les
  // filtres fins de la sidebar).
  function resetQuick() {
    setMany([], quickKeys);
  }

  return (
    <>
      {/* 3 · Rangée de chips filtres rapides (horizontale, wrap) */}
      <div className="flex flex-wrap items-center gap-2.5 mb-9 md:mb-11">
        <QuickChip active={!anyQuickActive} onClick={resetQuick}>
          {copy.common.all}
        </QuickChip>
        {quickFilters.map((q) => (
          <QuickChip
            key={q.id}
            active={isQuickActive(q)}
            onClick={() => applyQuick(q)}
          >
            {q.label}
          </QuickChip>
        ))}
      </div>

      {/* 4 · Zone principale : sidebar (desktop) + contenu */}
      <div className="flex flex-col lg:flex-row lg:gap-12">
        {/* Sidebar filtres inline — desktop uniquement.
            L'en-tête « Filtrer / Réinitialiser » et le bloc réassurance sont
            rendus par FilterControls (showHeader / showReassurance) pour un
            look identique dans le tiroir mobile. */}
        <aside className="hidden lg:block w-[236px] shrink-0">
          <FilterControls
            categories={categories}
            materials={materials}
            collections={collections}
            counts={counts}
            lockedCategory
            hideSort
            showHeader
            showReassurance
            locale={locale}
          />
        </aside>

        {/* Contenu droit */}
        <div className="flex-1 min-w-0">
          {/* Barre d'outils : compteur · tri · (mobile) Filtrer */}
          <div className="flex items-center justify-between gap-3 pb-5 mb-7 border-b border-[#e6e1d8]">
            <span className="font-sans text-[13px] text-[#5b554c] whitespace-nowrap">
              {resultCount} {resultCount > 1 ? copy.common.models : copy.common.model}
            </span>

            <div className="flex items-center gap-2.5">
              <label className="flex items-center gap-2">
                <span className="font-sans text-[12px] tracking-[0.14em] uppercase text-[#9b9488] hidden sm:inline">
                  {copy.catalog.sort}
                </span>
                <select
                  aria-label={copy.catalog.sortProducts}
                  value={get("tri")}
                  onChange={(e) => setParam("tri", e.target.value || null)}
                  className="font-sans text-[13px] text-ink bg-transparent border border-[#dad4c9] rounded-xs px-3 h-[40px] cursor-pointer focus:border-[#cdb89a] outline-none"
                >
                  {sortOptions.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>

              {/* Déclencheur du tiroir — mobile / tablette uniquement */}
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="lg:hidden inline-flex items-center gap-2 h-[40px] px-4 border border-[#dad4c9] rounded-xs font-sans text-[13px] tracking-[0.04em] text-ink cursor-pointer hover:border-ink transition-colors"
                aria-haspopup="dialog"
                aria-expanded={drawerOpen}
                aria-controls="catalog-filter-drawer"
              >
                <FilterIcon />
                {copy.catalog.filter}
              </button>
            </div>
          </div>

          {/* Grille produits (server component) */}
          {children}

          {/* Pagination (liens serveur) — sous la grille, avant le CTA */}
          {pagination}

          {/* Bandeau CTA pleine largeur du contenu */}
          <div className="mt-11 bg-ink text-ivory-light rounded-xs px-7 py-8 md:px-10 md:py-9 flex flex-col xl:flex-row xl:items-center gap-4 xl:gap-6">
            <span aria-hidden className="text-[#cdb89a] text-[22px] leading-none">
              ✦
            </span>
            <p className="font-serif text-[20px] md:text-[22px] xl:text-[21px] 2xl:text-[22px] leading-[1.35] text-ivory-light flex-1 xl:whitespace-nowrap">
              {copy.catalog.advice}
            </p>
            <Link
              href={localizedPath("/la-maison", locale)}
              className="font-sans text-[13px] tracking-[0.06em] text-[#cdb89a] hover:text-ivory-light transition-colors whitespace-nowrap"
            >
              {copy.common.learnMore} →
            </Link>
          </div>

          {/* Compteur : modèles vus jusqu'ici sur le total filtré */}
          {resultCount > 0 && (
            <p className="mt-8 text-center font-sans text-[13px] text-[#9b9488]">
              {interpolate(copy.catalog.seen, {
                shown: shownCount,
                shownPlural: shownCount > 1 ? "s" : "",
                total: resultCount,
              })}
            </p>
          )}
        </div>
      </div>

      {/* Tiroir mobile (réutilise le composant existant) */}
      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        resultCount={resultCount}
        locale={locale}
      >
        <FilterControls
          categories={categories}
          materials={materials}
          collections={collections}
          counts={counts}
          lockedCategory
          hideSort
          showReassurance
          locale={locale}
        />
      </FilterDrawer>
    </>
  );
}

/* ---------- Chip pilule (rangée de filtres rapides) ---------- */
function QuickChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "inline-flex items-center h-[39px] px-4 rounded-full font-sans text-[13px] transition-colors cursor-pointer",
        active
          ? "bg-ink text-white border border-ink"
          : "bg-white text-[#3b362f] border border-[#dad4c9] hover:border-ink",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function FilterIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M3 5h18M6 12h12M10 19h4" />
    </svg>
  );
}
