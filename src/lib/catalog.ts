import type { Product, Category, Material } from "./types";
import { getAllProducts } from "@/lib/products";
import type { Locale } from "@/lib/i18n";

/** Source de vérité unique du filtrage/tri catalogue (serveur). */
export interface CatalogQuery {
  categorie?: string;
  matiere?: string;
  collection?: string;
  /** Taille demandée (id de variante, ex. "m") — ne garde que les pièces où elle est dispo. */
  taille?: string;
  /** Prix en CENTIMES (déjà convertis depuis les € de l'URL). */
  prixMin?: number;
  prixMax?: number;
  dispo?: boolean;
  tri?: string;
}

/** Comptes par option (facettes) pour guider l'utilisateur dans les filtres. */
export interface FacetCounts {
  categorie: Record<string, number>;
  matiere: Record<string, number>;
  collection: Record<string, number>;
  taille: Record<string, number>;
}

/** Calcule les comptes par facette sur une liste de produits (catalogue de base). */
export function facetCounts(products: Product[]): FacetCounts {
  const f: FacetCounts = { categorie: {}, matiere: {}, collection: {}, taille: {} };
  for (const p of products) {
    f.categorie[p.category] = (f.categorie[p.category] ?? 0) + 1;
    f.collection[p.collection] = (f.collection[p.collection] ?? 0) + 1;
    for (const m of p.materials) f.matiere[m] = (f.matiere[m] ?? 0) + 1;
    for (const v of p.variants) {
      const key = v.key ?? v.sizeLabel?.toLowerCase() ?? v.id;
      if (v.available) f.taille[key] = (f.taille[key] ?? 0) + 1;
    }
  }
  return f;
}

type RawParams = Record<string, string | string[] | undefined>;

/** Garde-fou prix : 1 000 000 € (en centimes). Au-delà → borné. */
const MAX_PRICE_CENTS = 100_000_000;
/** Valeurs de tri reconnues (toute autre valeur est ignorée). */
const VALID_SORTS = new Set(["nouveautes", "prix-asc", "prix-desc"]);

/**
 * Convertit les searchParams d'URL en CatalogQuery typée et SÛRE.
 *
 * Stratégie face aux entrées invalides (jamais d'erreur serveur, jamais de NaN,
 * comportement déterministe) :
 *  - paramètre répété (?matiere=a&matiere=b) → on prend la PREMIÈRE valeur ;
 *  - espaces → trimés ; chaîne vide → ignorée (param absent) ;
 *  - prix non numérique / négatif → IGNORÉ (param absent) ;
 *  - décimales acceptées ("19,99" ou "19.99") ;
 *  - prix excessif → BORNÉ à MAX_PRICE_CENTS ;
 *  - tri inconnu → ignoré ;
 *  - slug matière/collection/catégorie inexistant → conservé mais ne matche
 *    aucun produit (état vide + reset disponible) ; pas de crash ;
 *  - bornes incohérentes (min > max) → CONSERVÉES telles quelles → 0 résultat
 *    via l'état vide ; pas de correction silencieuse (l'utilisateur corrige via
 *    les chips ou « Tout réinitialiser »).
 */
export function parseCatalogQuery(sp: RawParams): CatalogQuery {
  const get = (k: string): string | undefined => {
    const raw = sp[k];
    const v = Array.isArray(raw) ? raw[0] : raw; // param répété → première valeur
    const trimmed = typeof v === "string" ? v.trim() : "";
    return trimmed || undefined; // chaîne vide → absent
  };

  const toCents = (v?: string): number | undefined => {
    if (!v) return undefined;
    const n = parseFloat(v.replace(",", "."));
    if (!Number.isFinite(n) || n < 0) return undefined; // NaN / négatif → ignoré
    return Math.min(Math.round(n * 100), MAX_PRICE_CENTS); // borné
  };

  const tri = get("tri");

  return {
    categorie: get("categorie"),
    matiere: get("matiere"),
    collection: get("collection"),
    taille: get("taille")?.toLowerCase(),
    prixMin: toCents(get("prix-min")),
    prixMax: toCents(get("prix-max")),
    dispo: get("dispo") === "en-stock",
    tri: tri && VALID_SORTS.has(tri) ? tri : undefined,
  };
}

/** Filtre + trie le catalogue (DB) à partir d'une CatalogQuery. */
export async function filterCatalog(q: CatalogQuery, locale: Locale = "fr"): Promise<Product[]> {
  let list = await getAllProducts(locale);

  if (q.categorie) {
    list = list.filter((p) => p.category === (q.categorie as Category));
  }
  if (q.matiere) {
    list = list.filter((p) => p.materials.includes(q.matiere as Material));
  }
  if (q.collection) {
    list = list.filter((p) => p.collection === q.collection);
  }
  // Taille : ne garde que les pièces où la taille demandée est DISPONIBLE
  // (variante existante et en stock). Filtre conversion clé en mode.
  if (q.taille) {
    list = list.filter((p) =>
      p.variants.some((v) => v.available && (v.key === q.taille || v.id === q.taille)),
    );
  }
  // Prix : on filtre sur `p.price` = prix de BASE = prix MINIMUM réellement
  // achetable = prix affiché sur la carte produit. (Les variantes ne peuvent
  // qu'AJOUTER un surcoût via priceDelta ≥ 0 ; la variante de base est toujours
  // disponible au prix affiché.) Le filtre correspond donc exactement à ce que
  // le client voit et peut payer — choix le moins surprenant pour un listing.
  if (typeof q.prixMin === "number") {
    list = list.filter((p) => p.price >= q.prixMin!);
  }
  if (typeof q.prixMax === "number") {
    list = list.filter((p) => p.price <= q.prixMax!);
  }
  // Disponibilité : `p.inStock` === (status "active" ET stock > 0), calculé dans
  // lib/products.ts. Niveau PRODUIT (pas variante) : un produit actif et en
  // stock est listé même si certaines variantes (tailles) sont indisponibles —
  // l'indisponibilité fine d'une variante est gérée au panier/checkout.
  if (q.dispo) {
    list = list.filter((p) => p.inStock);
  }

  switch (q.tri) {
    case "prix-asc":
      list = [...list].sort((a, b) => a.price - b.price);
      break;
    case "prix-desc":
      list = [...list].sort((a, b) => b.price - a.price);
      break;
    case "nouveautes":
      list = [...list].sort(
        (a, b) =>
          (b.badge === "Nouveauté" ? 1 : 0) - (a.badge === "Nouveauté" ? 1 : 0),
      );
      break;
  }

  return list;
}
