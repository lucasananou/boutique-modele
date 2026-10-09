"use client";

import { useState } from "react";
import type { CategoryMeta, MaterialMeta, Collection } from "@/lib/types";
import type { FacetCounts } from "@/lib/catalog";
import { useCatalogParams } from "./useCatalogParams";
import { FilterControls } from "./FilterControls";
import { FilterDrawer } from "./FilterDrawer";

const sortOptions = [
  { value: "", label: "Recommandé" },
  { value: "nouveautes", label: "Nouveautés" },
  { value: "prix-asc", label: "Prix croissant" },
  { value: "prix-desc", label: "Prix décroissant" },
];
const sortLabels: Record<string, string> = {
  nouveautes: "Nouveautés",
  "prix-asc": "Prix croissant",
  "prix-desc": "Prix décroissant",
};

interface Props {
  categories: CategoryMeta[];
  materials: MaterialMeta[];
  collections: Collection[];
  counts?: FacetCounts;
  resultCount: number;
  lockedCategory?: boolean;
}

export function CatalogToolbar({
  categories,
  materials,
  collections,
  counts,
  resultCount,
  lockedCategory = false,
}: Props) {
  const { get, setParam, clearAll, hasActiveFilters } = useCatalogParams();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Chips de filtres actifs (supprimables individuellement).
  const chips: { key: string; label: string }[] = [];
  if (!lockedCategory && get("categorie")) {
    const c = categories.find((x) => x.slug === get("categorie"));
    if (c) chips.push({ key: "categorie", label: c.name });
  }
  if (get("matiere")) {
    const m = materials.find((x) => x.slug === get("matiere"));
    if (m) chips.push({ key: "matiere", label: m.name });
  }
  if (get("collection")) {
    const c = collections.find((x) => x.slug === get("collection"));
    if (c) chips.push({ key: "collection", label: c.name });
  }
  if (get("taille"))
    chips.push({ key: "taille", label: `Taille ${get("taille").toUpperCase()}` });
  if (get("prix-min")) chips.push({ key: "prix-min", label: `≥ ${get("prix-min")} €` });
  if (get("prix-max")) chips.push({ key: "prix-max", label: `≤ ${get("prix-max")} €` });
  if (get("dispo") === "en-stock") chips.push({ key: "dispo", label: "En stock" });
  if (get("tri") && sortLabels[get("tri")])
    chips.push({ key: "tri", label: sortLabels[get("tri")] });

  const filterCount = chips.filter((c) => c.key !== "tri").length;

  return (
    <div className="mb-10">
      {/* Barre compacte : compteur · tri · bouton Filtrer */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-sand-soft">
        <span className="font-sans text-[13px] text-warm-500 whitespace-nowrap">
          {resultCount} pièce{resultCount > 1 ? "s" : ""}
        </span>

        <div className="flex items-center gap-2.5">
          {/* Tri inline */}
          <label className="flex items-center gap-2">
            <span className="eyebrow hidden sm:inline">Trier</span>
            <select
              aria-label="Trier les produits"
              value={get("tri")}
              onChange={(e) => setParam("tri", e.target.value || null)}
              className="font-sans text-[13px] text-ink bg-transparent border border-ink/15 rounded-xs px-3 h-[40px] cursor-pointer focus:border-champagne outline-none"
            >
              {sortOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          {/* Déclencheur du tiroir */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center gap-2 h-[40px] px-4 border border-ink/20 rounded-xs font-sans text-[13px] tracking-[0.04em] text-ink cursor-pointer hover:border-ink transition-colors"
            aria-haspopup="dialog"
            aria-expanded={drawerOpen}
            aria-controls="catalog-filter-drawer"
          >
            <FilterIcon />
            <span className="hidden sm:inline">Filtrer</span>
            {filterCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 bg-ink text-ivory-light rounded-full text-[11px]">
                {filterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filtres actifs */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-5">
          <span className="eyebrow mr-1">Filtres actifs</span>
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => setParam(chip.key, null)}
              aria-label={`Retirer le filtre ${chip.label}`}
              className="inline-flex items-center gap-1.5 min-h-[34px] px-3 bg-mineral text-ink rounded-full font-sans text-[12.5px] cursor-pointer hover:bg-sand transition-colors"
            >
              {chip.label}
              <span aria-hidden className="text-warm-500">
                ✕
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="min-h-[34px] px-2 font-sans text-[12.5px] text-warm-500 underline decoration-champagne underline-offset-2 hover:text-champagne transition-colors cursor-pointer"
          >
            Tout réinitialiser
          </button>
        </div>
      )}

      {/* Tiroir coulissant (tous écrans) */}
      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        resultCount={resultCount}
      >
        <FilterControls
          categories={categories}
          materials={materials}
          collections={collections}
          counts={counts}
          lockedCategory={lockedCategory}
          hideSort
        />
      </FilterDrawer>
    </div>
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
