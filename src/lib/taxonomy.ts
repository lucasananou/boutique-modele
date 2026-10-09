import { prisma } from "@/lib/db";
import type {
  Collection,
  CategoryMeta,
  MaterialMeta,
  Category,
  Material,
} from "@/lib/types";
import { categoryHref } from "@/lib/categories";
import type { Prisma } from "@/generated/prisma";
import type { Locale } from "@/lib/i18n";

export async function getCollections(locale: Locale = "fr"): Promise<Collection[]> {
  const rows = await prisma.collection.findMany({
    orderBy: { sortOrder: "asc" }, include: { translations: true },
  });
  return rows.map((c) => ({
    slug: c.slug,
    season: translateSeason(c.season, locale),
    description: c.translations.find((t) => t.locale === locale)?.description ?? c.description,
    name: c.translations.find((t) => t.locale === locale)?.name ?? c.name,
    tagline: c.translations.find((t) => t.locale === locale)?.tagline ?? c.tagline,
    heroImage: { src: c.heroImageSrc, alt: translateCollectionAlt(c.slug, c.heroImageAlt, locale) },
  }));
}

export async function getCollection(
  slug: string,
  locale: Locale = "fr",
): Promise<Collection | undefined> {
  const c = await prisma.collection.findUnique({ where: { slug }, include: { translations: true } });
  if (!c) return undefined;
  return {
    slug: c.slug,
    name: c.translations.find((t) => t.locale === locale)?.name ?? c.name,
    season: translateSeason(c.season, locale),
    tagline: c.translations.find((t) => t.locale === locale)?.tagline ?? c.tagline,
    description: c.translations.find((t) => t.locale === locale)?.description ?? c.description,
    heroImage: { src: c.heroImageSrc, alt: translateCollectionAlt(c.slug, c.heroImageAlt, locale) },
  };
}

type CategoryRow = Prisma.CategoryGetPayload<{ include: { translations: true } }>;
type Faq = { q: string; a: string };

/** Catégorie en base → données d'affichage, avec repli sur le français. */
function toCategoryMeta(c: CategoryRow, locale: Locale): CategoryMeta {
  const tr = locale === "fr" ? undefined : c.translations.find((t) => t.locale === locale);
  const name = tr?.name ?? c.name;
  const seoTitle = (locale === "fr" ? c.seoTitle : tr?.seoTitle) ?? name;
  const faqs = ((tr?.faqs ?? c.faqs) as Faq[] | null) ?? [];
  return {
    slug: c.slug as Category,
    name,
    description: tr?.description ?? c.description,
    image: {
      src: c.image || c.imageSrc,
      alt: tr?.imageAlt ?? c.imageAlt,
    },
    href: categoryHref(c),
    seoTitle,
    seoHeading: (locale === "fr" ? c.seoHeading : tr?.seoHeading) ?? seoTitle,
    seoText: tr?.seoText ?? c.seoText ?? undefined,
    faqs,
  };
}

export async function getCategories(locale: Locale = "fr"): Promise<CategoryMeta[]> {
  const rows = await prisma.category.findMany({
    where: {
      products: {
        some: { status: "active", catalogVisible: true },
      },
    },
    orderBy: { sortOrder: "asc" }, include: { translations: true },
  });
  return rows.map((c) => toCategoryMeta(c, locale));
}

export async function getCategory(
  slug: string,
  locale: Locale = "fr",
): Promise<CategoryMeta | undefined> {
  const c = await prisma.category.findUnique({ where: { slug }, include: { translations: true } });
  return c ? toCategoryMeta(c, locale) : undefined;
}

/*
 * Textes alternatifs traduits des visuels de collection, par slug. Les
 * traductions de nom/description se saisissent en base (CollectionTranslation).
 */
const COLLECTION_HERO_ALTS: Record<Locale, Record<string, string>> = {
  fr: {},
  en: {},
  he: {},
};

function translateCollectionAlt(slug: string, fallback: string, locale: Locale) {
  return COLLECTION_HERO_ALTS[locale][slug] ?? fallback;
}

export async function getMaterials(_locale: Locale = "fr"): Promise<MaterialMeta[]> {
  const rows = await prisma.material.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return rows.map((m) => ({
    slug: m.slug as Material,
    name: translateMaterial(m.slug, m.name, _locale),
    description: m.description,
  }));
}

function translateMaterial(slug: string, fallback: string, locale: Locale) {
  const labels: Record<Locale, Record<string, string>> = {
    fr: {},
    en: {
      coton: "Cotton",
      maille: "Knit",
      jean: "Denim",
      lin: "Linen",
      viscose: "Viscose",
    },
    he: {
      coton: "כותנה",
      maille: "סריג",
      jean: "ג׳ינס",
      lin: "פשתן",
      viscose: "ויסקוזה",
    },
  };
  return labels[locale][slug] ?? fallback;
}

function translateSeason(season: string | null, locale: Locale) {
  if (!season) return undefined;
  const normalized = season
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
  if (normalized.includes("toute l") || normalized.includes("toute l'annee")) {
    return locale === "en" ? "All year" : locale === "he" ? "כל השנה" : season;
  }
  if (normalized.includes("nouveaute")) {
    return locale === "en" ? "New arrivals" : locale === "he" ? "פריטים חדשים" : season;
  }
  if (normalized.includes("saison froide")) {
    return locale === "en" ? "Cold season" : locale === "he" ? "עונה קרה" : season;
  }
  return season;
}
