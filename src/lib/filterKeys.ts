/**
 * Clés de filtres/tri du catalogue — module PUR (aucune dépendance Prisma),
 * importable côté serveur ET client. Source unique de vérité partagée par
 * `lib/catalog.ts` (serveur), `useCatalogParams.ts` (client) et le SEO.
 */
export const FILTER_PARAM_KEYS = [
  "categorie",
  "matiere",
  "collection",
  "taille",
  "prix-min",
  "prix-max",
  "dispo",
  "tri",
] as const;

type RawParams = Record<string, string | string[] | undefined>;

/**
 * Vrai si l'URL porte au moins un paramètre de filtre/tri non vide.
 * Sert au SEO : les pages filtrées sont mises en noindex.
 */
export function hasActiveFilterParams(sp: RawParams): boolean {
  return FILTER_PARAM_KEYS.some((k) => {
    const v = sp[k];
    const first = Array.isArray(v) ? v[0] : v;
    return typeof first === "string" && first.trim() !== "";
  });
}
