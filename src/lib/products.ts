import { store } from "@/stores";
import { prisma } from "@/lib/db";
import type { Product, Category, Material } from "@/lib/types";
import type { Locale } from "@/lib/i18n";
import { colorHexForName } from "@/lib/colorUtils";

const include = {
  category: { include: { translations: true } },
  collection: { include: { translations: true } },
  materials: { orderBy: { sortOrder: "asc" } },
  variants: { orderBy: { sortOrder: "asc" } },
  images: { orderBy: { sortOrder: "asc" } },
  details: { orderBy: { sortOrder: "asc" } },
  translations: true,
} as const;

type Row = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  sku: string;
  materialLabel: string;
  shortDescription: string;
  description: string;
  seoTitle: string | null;
  seoDescription: string | null;
  badge: string | null;
  iconic: boolean;
  limited: boolean;
  stock: number;
  status: string;
  category: {
    slug: string;
    name: string;
    translations: { locale: string; name: string }[];
  };
  collection: {
    slug: string;
    name: string;
    translations: { locale: string; name: string }[];
  };
  materials: { slug: string }[];
  variants: {
    id: string;
    key: string;
    label: string;
    sku: string | null;
    optionName: string;
    optionValue: string | null;
    colorName: string | null;
    colorHex: string | null;
    sizeLabel: string | null;
    stock: number;
    priceDelta: number;
    available: boolean;
  }[];
  images: { src: string; alt: string; variantId: string | null }[];
  details: { label: string; value: string }[];
  translations: { locale: string; name: string; shortDescription: string; description: string; seoTitle: string | null; seoDescription: string | null }[];
};

/**
 * Libellés de détails JAMAIS exposés côté boutique : ils viennent des imports
 * et révéleraient le sourcing (« Prix fournisseur : 9,00 € » sur une pièce
 * vendue 89 €, nom du grossiste, lien vers sa fiche…). Ils restent en base et
 * consultables dans l'admin, qui lit le catalogue par un autre chemin.
 * Le filtrage se fait ici, dans la couche de données, pour qu'aucune page ni
 * charge utile RSC ne puisse les laisser fuiter.
 */
const INTERNAL_DETAIL_PATTERNS = [
  "grossiste",
  "source",
  "import",
  "reference grossiste",
  "categorie",
  "fournisseur", // Fournisseur, Prix fournisseur, Référence fournisseur
  "prix boutique",
  "prix calcule",
  "statut",
  "achat",
  "marge",
  "url",
];

function normalizeDetailLabel(label: string) {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\?/g, "e")
    .toLowerCase()
    .trim();
}

function publicDetails(details: Row["details"]) {
  return details
    .filter((detail) => {
      const label = normalizeDetailLabel(detail.label);
      return !INTERNAL_DETAIL_PATTERNS.some((pattern) =>
        label.includes(pattern),
      );
    })
    .map((detail) => ({ label: detail.label, value: detail.value }));
}

function publicBadge(badge: string | null, locale: Locale = "fr") {
  if (!badge) return undefined;
  const normalized = normalizeLookup(badge);
  if (normalized === "nouveaute") {
    return locale === "en" ? "New" : locale === "he" ? "חדש" : "Nouveauté";
  }
  if (badge === "Nouveaut?") return "Nouveauté";
  return badge;
}

/* Libellés traduits par slug de catégorie (repli si CategoryTranslation est vide). */
const CATEGORY_LABELS: Record<Locale, Record<string, string>> = { fr: {}, en: {}, he: {} };

const DETAIL_LABELS: Record<Locale, Record<string, string>> = {
  fr: {},
  en: {
    taille: "Size",
    tailles: "Sizes",
    couleur: "Color",
    "couleur importee": "Imported color",
    "couleurs importees": "Imported colors",
    longueur: "Length",
    composition: "Composition",
    matiere: "Fabric",
    matieres: "Fabrics",
    coupe: "Fit",
    details: "Details",
    entretien: "Care",
    doublure: "Lining",
    transparence: "Opacity",
  },
  he: {
    taille: "מידה",
    tailles: "מידות",
    couleur: "צבע",
    "couleur importee": "צבע מיובא",
    "couleurs importees": "צבעים מיובאים",
    longueur: "אורך",
    composition: "הרכב",
    matiere: "בד",
    matieres: "בדים",
    coupe: "גזרה",
    details: "פרטים",
    entretien: "טיפול",
    doublure: "בטנה",
    transparence: "אטימות",
  },
};

const DETAIL_VALUES: Record<Locale, Record<string, string>> = {
  fr: {},
  en: {
    tu: "One size",
    "taille unique": "One size",
    "taille unique (36-40)": "One size (36-40)",
    "taille unique (38-44)": "One size (38-44)",
    "s-m et m-l": "S-M and M-L",
    "s/m et m/l": "S/M and M/L",
    "s, m et l": "S, M and L",
    "t1 et t2": "T1 and T2",
    "m-l et xl-xxl": "M-L and XL-XXL",
    disponible: "Available",
    indisponible: "Unavailable",
  },
  he: {
    tu: "מידה אחת",
    "taille unique": "מידה אחת",
    "taille unique (36-40)": "מידה אחת (36-40)",
    "taille unique (38-44)": "מידה אחת (38-44)",
    "s-m et m-l": "S-M ו-M-L",
    "s/m et m/l": "S/M ו-M/L",
    "s, m et l": "S, M ו-L",
    "t1 et t2": "T1 ו-T2",
    "m-l et xl-xxl": "M-L ו-XL-XXL",
    disponible: "זמין",
    indisponible: "לא זמין",
  },
};

const COLOR_LABELS: Record<Locale, Record<string, string>> = {
  fr: {},
  en: {
    beige: "Beige",
    blanc: "White",
    blanche: "White",
    "bleu jean": "Denim blue",
    "bleu marine": "Navy blue",
    bleu: "Blue",
    bordeaux: "Burgundy",
    brique: "Brick",
    choco: "Chocolate",
    ecru: "Ecru",
    écru: "Ecru",
    ivoire: "Ivory",
    kaki: "Khaki",
    marine: "Navy",
    marron: "Brown",
    noir: "Black",
    noire: "Black",
    taupe: "Taupe",
    terracotta: "Terracotta",
    vert: "Green",
    rose: "Pink",
  },
  he: {
    beige: "בז׳",
    blanc: "לבן",
    blanche: "לבן",
    "bleu jean": "כחול ג׳ינס",
    "bleu marine": "כחול נייבי",
    bleu: "כחול",
    bordeaux: "בורדו",
    brique: "בריק",
    choco: "שוקולד",
    ecru: "אקרו",
    écru: "אקרו",
    ivoire: "אייבורי",
    kaki: "חאקי",
    marine: "נייבי",
    marron: "חום",
    noir: "שחור",
    noire: "שחור",
    taupe: "טאופ",
    terracotta: "טרקוטה",
    vert: "ירוק",
    rose: "ורוד",
  },
};

/* Traductions exactes de libellés matière du catalogue (à compléter si besoin). */
const MATERIAL_LABELS: Record<Locale, Record<string, string>> = { fr: {}, en: {}, he: {} };

/* Traductions exactes de phrases de détails produit du catalogue (à compléter si besoin). */
const DETAIL_PHRASES: Record<Locale, Record<string, string>> = { fr: {}, en: {}, he: {} };

function normalizeLookup(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\?/g, "e")
    .toLowerCase()
    .trim();
}

function lookupTranslation(
  value: string | null | undefined,
  labels: Record<Locale, Record<string, string>>,
  locale: Locale,
) {
  if (!value || locale === "fr") return undefined;
  return labels[locale][normalizeLookup(value)];
}

function translateOptionName(optionName: string, locale: Locale) {
  if (locale === "fr") return optionName;
  const normalized = normalizeLookup(optionName);
  if (normalized.includes("couleur") && normalized.includes("taille")) {
    return locale === "en" ? "Color / Size" : "צבע / מידה";
  }
  if (normalized.includes("couleur")) {
    return locale === "en" ? "Color" : "צבע";
  }
  if (normalized.includes("taille")) {
    return locale === "en" ? "Size" : "מידה";
  }
  return optionName;
}

function translateVariantLabel(label: string, locale: Locale): string {
  if (label.includes("/")) {
    return label
      .split("/")
      .map((part) => translateVariantLabel(part.trim(), locale))
      .join(" / ");
  }
  return (
    lookupTranslation(label, COLOR_LABELS, locale) ??
    lookupTranslation(label, DETAIL_VALUES, locale) ??
    label
  );
}

function translateDetail(detail: { label: string; value: string }, locale: Locale) {
  if (locale === "fr") return detail;
  return {
    label:
      lookupTranslation(detail.label, DETAIL_LABELS, locale) ?? detail.label,
    value:
      lookupTranslation(detail.value, DETAIL_VALUES, locale) ??
      lookupTranslation(detail.value, COLOR_LABELS, locale) ??
      lookupTranslation(detail.value, MATERIAL_LABELS, locale) ??
      lookupTranslation(detail.value, DETAIL_PHRASES, locale) ??
      translateCommonDetailText(detail.value, locale),
  };
}

function translateMaterialLabel(label: string, locale: Locale) {
  if (locale === "fr") return label;
  return (
    lookupTranslation(label, MATERIAL_LABELS, locale) ??
    translateCommonDetailText(label, locale)
  );
}

function translateCommonDetailText(value: string, locale: Locale) {
  if (locale === "fr") return value;
  const translated = locale === "en" ? translateCommonDetailTextEn(value) : translateCommonDetailTextHe(value);
  return translated.trim() || value;
}

function translateCommonDetailTextEn(value: string) {
  return value
    .replace(/\bTaille unique\b/gi, "One size")
    .replace(/\bTailles\b/gi, "Sizes")
    .replace(/\bTaille\b/gi, "Size")
    .replace(/\bDétails\b/gi, "Details")
    .replace(/\bCoupe\b/gi, "Fit")
    .replace(/\bMatières?\b/gi, "Fabric")
    .replace(/\bCouleurs?\b/gi, "Colors")
    .replace(/\bimportées?\b/gi, "imported")
    .replace(/\bléger(?:e|es|s)?\b/gi, "lightweight")
    .replace(/\bfluide(?:s)?\b/gi, "fluid")
    .replace(/\bample(?:s)?\b/gi, "loose")
    .replace(/\bévasée?s?\b/gi, "flared")
    .replace(/\bplissée?s?\b/gi, "pleated")
    .replace(/\bmanches longues\b/gi, "long sleeves")
    .replace(/\bmanches bouffantes\b/gi, "puff sleeves")
    .replace(/\bcol rond\b/gi, "round neckline")
    .replace(/\bcol montant\b/gi, "high neckline")
    .replace(/\bcol bateau\b/gi, "boat neckline")
    .replace(/\bencolure carrée\b/gi, "square neckline")
    .replace(/\btaille haute\b/gi, "high waist")
    .replace(/\btaille élastiquée\b/gi, "elasticated waist")
    .replace(/\bdoublure opaque\b/gi, "opaque lining")
    .replace(/\bdoublure\b/gi, "lining")
    .replace(/\bvolants superposés\b/gi, "layered ruffles")
    .replace(/\bvolants\b/gi, "ruffles")
    .replace(/\bceinture\b/gi, "belt")
    .replace(/\bpoches\b/gi, "pockets")
    .replace(/\blaine\b/gi, "wool")
    .replace(/\bcoton\b/gi, "cotton")
    .replace(/\bélasthanne\b/gi, "elastane")
    .replace(/\bdentelle\b/gi, "lace")
    .replace(/\bmaille\b/gi, "knit")
    .replace(/\bknit douce\b/gi, "soft knit")
    .replace(/\bdouce\b/gi, "soft")
    .replace(/\bmotifs cœurs\b/gi, "heart motifs")
    .replace(/\bmotifs coeurs\b/gi, "heart motifs")
    .replace(/\bcœurs rouges\b/gi, "red hearts")
    .replace(/\bcoeurs rouges\b/gi, "red hearts")
    .replace(/\ben relief\b/gi, "raised")
    .replace(/\bvelours côtelé\b/gi, "corduroy")
    .replace(/\bvelours cotele\b/gi, "corduroy")
    .replace(/\bfinition dentelle\b/gi, "lace finish")
    .replace(/\bdentelle\b/gi, "lace")
    .replace(/\btulle\b/gi, "tulle")
    .replace(/\btissu\b/gi, "fabric")
    .replace(/\bsouple\b/gi, "soft")
    .replace(/\bnoir(?:e)?\b/gi, "black")
    .replace(/\bbeige\b/gi, "beige")
    .replace(/\bà\b/gi, "with")
    .replace(/\bet\b/gi, "and")
    .replace(/\ben\b/gi, "in");
}

function translateCommonDetailTextHe(value: string) {
  return value
    .replace(/\bTaille unique\b/gi, "מידה אחת")
    .replace(/\bTailles\b/gi, "מידות")
    .replace(/\bTaille\b/gi, "מידה")
    .replace(/\bDétails\b/gi, "פרטים")
    .replace(/\bCoupe\b/gi, "גזרה")
    .replace(/\bMatières?\b/gi, "בד")
    .replace(/\bCouleurs?\b/gi, "צבעים")
    .replace(/\bimportées?\b/gi, "מיובאים")
    .replace(/\bléger(?:e|es|s)?\b/gi, "קליל")
    .replace(/\bfluide(?:s)?\b/gi, "נשפך")
    .replace(/\bample(?:s)?\b/gi, "רחב")
    .replace(/\bévasée?s?\b/gi, "מתרחב")
    .replace(/\bplissée?s?\b/gi, "פליסה")
    .replace(/\bmanches longues\b/gi, "שרוולים ארוכים")
    .replace(/\bmanches bouffantes\b/gi, "שרוולים תפוחים")
    .replace(/\bcol rond\b/gi, "מפתח עגול")
    .replace(/\bcol montant\b/gi, "צווארון גבוה")
    .replace(/\bcol bateau\b/gi, "מפתח סירה")
    .replace(/\bencolure carrée\b/gi, "מפתח מרובע")
    .replace(/\btaille haute\b/gi, "מותן גבוהה")
    .replace(/\btaille élastiquée\b/gi, "מותן אלסטית")
    .replace(/\bdoublure opaque\b/gi, "בטנה אטומה")
    .replace(/\bdoublure\b/gi, "בטנה")
    .replace(/\bvolants superposés\b/gi, "וולנים שכבות")
    .replace(/\bvolants\b/gi, "וולנים")
    .replace(/\bceinture\b/gi, "חגורה")
    .replace(/\bpoches\b/gi, "כיסים")
    .replace(/\blaine\b/gi, "צמר")
    .replace(/\bcoton\b/gi, "כותנה")
    .replace(/\bélasthanne\b/gi, "אלסטן")
    .replace(/\bdentelle\b/gi, "תחרה")
    .replace(/\bmaille\b/gi, "סריג")
    .replace(/\bknit douce\b/gi, "סריג רך")
    .replace(/\bdouce\b/gi, "רך")
    .replace(/\bmotifs cœurs\b/gi, "מוטיבי לבבות")
    .replace(/\bmotifs coeurs\b/gi, "מוטיבי לבבות")
    .replace(/\bcœurs rouges\b/gi, "לבבות אדומים")
    .replace(/\bcoeurs rouges\b/gi, "לבבות אדומים")
    .replace(/\ben relief\b/gi, "מובלטים")
    .replace(/\bvelours côtelé\b/gi, "קורדרוי")
    .replace(/\bvelours cotele\b/gi, "קורדרוי")
    .replace(/\bfinition dentelle\b/gi, "גימור תחרה")
    .replace(/\bdentelle\b/gi, "תחרה")
    .replace(/\btulle\b/gi, "טול")
    .replace(/\btissu\b/gi, "בד")
    .replace(/\bsouple\b/gi, "רך")
    .replace(/\bnoir(?:e)?\b/gi, "שחור")
    .replace(/\bbeige\b/gi, "בז׳")
    .replace(/\bà\b/gi, "עם")
    .replace(/\bet\b/gi, "ו")
    .replace(/\ben\b/gi, "ב");
}

function publicImageAlt(productName: string, alt: string, index: number, locale: Locale) {
  if (locale === "fr") return alt;
  const suffix =
    locale === "en" ? `product photo ${index + 1}` : `תמונת מוצר ${index + 1}`;
  return `${productName} - ${suffix}`;
}

/** Mappe une ligne Prisma vers le type Product de l'application. */
function mapProduct(p: Row, locale: Locale = "fr"): Product {
  const translation = locale === "fr" ? undefined : p.translations.find((t) => t.locale === locale);
  const name = translation?.name ?? p.name;
  const shortDescription = translation?.shortDescription ?? p.shortDescription;
  const description = translation?.description ?? p.description;
  const categoryName =
    locale === "fr"
      ? p.category.name
      : p.category.translations.find((t) => t.locale === locale)?.name ??
        CATEGORY_LABELS[locale][p.category.slug] ??
        p.category.name;
  const collectionName =
    locale === "fr"
      ? p.collection.name
      : p.collection.translations.find((t) => t.locale === locale)?.name ??
        p.collection.name;

  // La composition n'apparaît plus en haut de fiche (elle doublonnait les
  // caractéristiques). Une dizaine de pièces ne la portaient QUE là : on la
  // bascule en caractéristique pour ne perdre l'information sur aucune fiche.
  const details = publicDetails(p.details);
  const material = (p.materialLabel ?? "").trim();
  if (
    material &&
    !details.some((d) => /mati|composi/i.test(normalizeDetailLabel(d.label)))
  ) {
    details.unshift({ label: "Matière", value: material });
  }

  return {
    id: p.id,
    slug: p.slug,
    name,
    sku: p.sku,
    price: p.price,
    compareAtPrice: p.compareAtPrice ?? undefined,
    category: p.category.slug as Category,
    categoryName,
    collection: p.collection.slug,
    collectionName,
    materials: p.materials.map((m) => m.slug as Material),
    materialLabel: translateMaterialLabel(p.materialLabel, locale),
    shortDescription,
    description,
    seoTitle: translation?.seoTitle ?? p.seoTitle ?? undefined,
    seoDescription: translation?.seoDescription ?? p.seoDescription ?? undefined,
    details: details.map((detail) => translateDetail(detail, locale)),
    images: p.images.map((i, index) => ({
      src: i.src,
      alt: publicImageAlt(name, i.alt, index, locale),
      variantId: i.variantId ?? undefined,
    })),
    variants: p.variants.map((v) => ({
      id: v.id,
      key: v.key,
      label: translateVariantLabel(v.label, locale),
      sku: v.sku ?? undefined,
      optionName: translateOptionName(v.optionName, locale),
      optionValue:
        (v.optionValue ? translateVariantLabel(v.optionValue, locale) : undefined) ??
        v.optionValue ??
        undefined,
      colorName:
        lookupTranslation(v.colorName, COLOR_LABELS, locale) ??
        v.colorName ??
        undefined,
      colorHex: v.colorName ? colorHexForName(v.colorName, v.colorHex ?? undefined) : v.colorHex ?? undefined,
      sizeLabel:
        lookupTranslation(v.sizeLabel, DETAIL_VALUES, locale) ??
        v.sizeLabel ??
        undefined,
      stock: v.stock,
      priceDelta: v.priceDelta,
      available: v.available,
    })),
    badge: publicBadge(p.badge, locale),
    iconic: p.iconic,
    limited: p.limited,
    stock: p.stock,
    inStock:
      p.status === "active" &&
      (p.stock > 0 || p.variants.some((v) => v.available && v.stock > 0)),
  };
}

/* ---------- Accès catalogue (Prisma) ---------- */

export async function getAllProducts(locale: Locale = "fr"): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { status: "active", catalogVisible: true },
    orderBy: { sortOrder: "asc" },
    include,
  });
  return rows.map((r) => mapProduct(r as Row, locale));
}

export async function getProductBySlug(
  slug: string,
  locale: Locale = "fr",
): Promise<Product | undefined> {
  const row = await prisma.product.findFirst({
    where: { slug, status: "active" },
    include,
  });
  return row ? mapProduct(row as Row, locale) : undefined;
}

/*
 * Fiche retirée (archivée, supprimée, ou ancienne URL d'un site précédent) :
 * plutôt qu'une 404, on renvoie vers la catégorie la plus proche pour garder les
 * visiteuses et l'autorité SEO des anciennes pages. Les brouillons restent en 404
 * (pièces pas encore publiées : une redirection permanente serait mémorisée).
 */
const RETIRED_CATEGORY_GUESS: [RegExp, string][] = [
  // Ex. : [/\b(robe|robes)\b/, "robes"] — mot de l'ancienne URL → slug de catégorie.
];

export async function retiredProductCategory(slug: string): Promise<string | null> {
  const row = await prisma.product.findFirst({
    where: { slug },
    select: { status: true, category: { select: { slug: true } } },
  });
  if (row && row.status !== "archived") return null; // actif, brouillon ou en relecture
  if (row) return row.category.slug;
  const words = slug.toLowerCase().replace(/-/g, " ");
  const hit = RETIRED_CATEGORY_GUESS.find(([re]) => re.test(words));
  return hit ? hit[1] : null;
}

export async function getProductsByCategory(
  category: Category,
  locale: Locale = "fr",
): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { category: { slug: category }, status: "active", catalogVisible: true },
    orderBy: { sortOrder: "asc" },
    include,
  });
  return rows.map((r) => mapProduct(r as Row, locale));
}

export async function getProductsByCollection(
  collection: string,
  locale: Locale = "fr",
): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { collection: { slug: collection }, status: "active", catalogVisible: true },
    orderBy: { sortOrder: "asc" },
    include,
  });
  return rows.map((r) => mapProduct(r as Row, locale));
}

export async function getIconicProducts(
  limit = 4,
  locale: Locale = "fr",
): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: {
      iconic: true,
      status: "active",
      catalogVisible: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include,
  });
  return rows.map((r) => mapProduct(r as Row, locale));
}

export async function getNewProducts(
  locale: Locale = "fr",
): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { badge: "Nouveauté", status: "active", catalogVisible: true },
    orderBy: { sortOrder: "asc" },
    include,
  });
  return rows.map((r) => mapProduct(r as Row, locale));
}

export async function countByCategory(category: Category): Promise<number> {
  return prisma.product.count({
    where: { category: { slug: category }, status: "active", catalogVisible: true },
  });
}

/**
 * Compte des produits par catégorie en UNE requête (groupBy) — évite le N+1
 * de `countByCategory` appelé en boucle. Renvoie { slug: nombre }.
 */
export async function getCategoryCounts(): Promise<Record<string, number>> {
  const [rows, cats] = await Promise.all([
    prisma.product.groupBy({
      by: ["categoryId"],
      where: { status: "active", catalogVisible: true },
      _count: { _all: true },
    }),
    prisma.category.findMany({ select: { id: true, slug: true } }),
  ]);
  const idToSlug = new Map(cats.map((c) => [c.id, c.slug]));
  const out: Record<string, number> = {};
  for (const r of rows) {
    const slug = idToSlug.get(r.categoryId);
    if (slug) out[slug] = r._count._all;
  }
  return out;
}

/* ---------- Vente additionnelle ---------- */

/** Catégories de repli de « Souvent acheté avec » (config : catalog.crossSellCategories). */
const CROSS_SELL_CATEGORIES: readonly string[] = store.catalog.crossSellCategories;

/** Décalage stable tiré de l'identifiant : deux fiches ne proposent pas la même sélection. */
function seedFrom(id: string): number {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum = (sum + id.charCodeAt(i)) % 9973;
  return sum;
}

/**
 * Suggestions « souvent acheté avec », par ordre de priorité :
 *   1. les pièces réellement commandées ensemble (commandes payées) ;
 *   2. à défaut — historique encore mince — une pièce par catégorie
 *      complémentaire, en stock et illustrée.
 *
 * Ne jette jamais : une panne de suggestion ne doit pas emporter la fiche
 * produit, qui est la page qui vend.
 */
export async function getFrequentlyBoughtWith(
  product: Product,
  locale: Locale = "fr",
  limit = 3,
): Promise<Product[]> {
  try {
    const picked = new Map<string, Product>();

    // 1. Associations réelles observées en commande.
    const orderIds = (
      await prisma.orderItem.findMany({
        where: {
          productId: product.id,
          order: { status: { in: ["PAID", "SHIPPED", "DELIVERED"] } },
        },
        select: { orderId: true },
        take: 500,
      })
    ).map((i) => i.orderId);

    if (orderIds.length > 0) {
      const together = await prisma.orderItem.groupBy({
        by: ["productId"],
        where: { orderId: { in: orderIds }, productId: { not: product.id } },
        _count: { productId: true },
        orderBy: { _count: { productId: "desc" } },
        take: limit * 2,
      });
      if (together.length > 0) {
        const rows = await prisma.product.findMany({
          where: {
            id: { in: together.map((c) => c.productId) },
            status: "active",
            catalogVisible: true,
          },
          include,
        });
        const byId = new Map(rows.map((r) => [r.id, r]));
        for (const c of together) {
          if (picked.size >= limit) break;
          const row = byId.get(c.productId);
          if (!row) continue;
          const mapped = mapProduct(row as Row, locale);
          if (mapped.inStock) picked.set(mapped.id, mapped);
        }
      }
    }

    if (picked.size >= limit) return [...picked.values()];

    // 2. Repli : les pièces mises en avant.
    const rows = await prisma.product.findMany({
      where: {
        category: { slug: { in: [...CROSS_SELL_CATEGORIES] } },
        status: "active",
        catalogVisible: true,
        id: { notIn: [product.id, ...picked.keys()] },
      },
      orderBy: { sortOrder: "asc" },
      include,
    });
    const pool = rows
      .map((r) => mapProduct(r as Row, locale))
      .filter((p) => p.inStock && p.images.length > 0);

    // Fenêtre glissante calée sur l'identifiant : deux fiches ne montrent pas
    // la même sélection, tout en restant stables d'un rendu à l'autre.
    const offset = seedFrom(product.id);
    for (let i = 0; i < pool.length && picked.size < limit; i++) {
      const candidate = pool[(offset + i) % pool.length];
      if (!picked.has(candidate.id)) picked.set(candidate.id, candidate);
    }

    return [...picked.values()];
  } catch {
    return [];
  }
}

/** Réexport de la fonction pure (compat imports existants). */
export { variantPrice } from "./productUtils";
