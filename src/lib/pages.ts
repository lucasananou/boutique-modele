import { cache } from "react";
import { prisma } from "@/lib/db";
import { brand } from "@/lib/brand";
import type { Locale } from "@/lib/i18n";
import type { SeoLandingConfig } from "@/components/seo/SeoLandingPage";

/*
 * Pages de contenu en base (table Page) : articles du journal et landings SEO,
 * servis à la racine (/<slug>) par src/app/(shop)/[categorie]/page.tsx.
 * Remplacent les anciens page.tsx et src/data/articles.ts / seoLandings.ts.
 */

export type Faq = { q: string; a: string };

export interface ArticleMeta {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  image: string;
  author?: string;
  publishedAt?: string;
  /** Date de mise à jour éditoriale (ISO), affichée « Mis à jour le ». */
  updatedAt?: string;
  readingMinutes?: number;
  faqs?: Faq[];
  outfitCategories?: string[];
  outfitTitle?: string;
  related?: string[];
  canonical?: string;
}

export interface PageLocaleContent {
  title: string | null;
  excerpt: string | null;
  category: string | null;
  outfitTitle: string | null;
  faqs: Faq[] | null;
  body: string | null;
  data: unknown;
  card: { title: string; excerpt: string; category: string } | null;
}

export interface ContentPage extends ArticleMeta {
  id: string;
  kind: string;
  status: string;
  body: string;
  data: unknown;
  translations: Partial<Record<Locale, PageLocaleContent>>;
}

/** Auteur par défaut des articles. */
export const DEFAULT_AUTHOR = `La rédaction ${brand.name}`;

type PageRow = Awaited<ReturnType<typeof loadAll>>[number];

const loadAll = cache(async () =>
  prisma.page.findMany({
    where: { status: "published" },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { translations: true },
  }),
);

function toPage(p: PageRow): ContentPage {
  return {
    id: p.id,
    slug: p.slug,
    kind: p.kind,
    status: p.status,
    title: p.title,
    excerpt: p.excerpt,
    category: p.category,
    image: p.image,
    author: p.author ?? undefined,
    publishedAt: p.publishedAt ?? undefined,
    updatedAt: p.contentUpdatedAt ?? undefined,
    readingMinutes: p.readingMinutes ?? undefined,
    faqs: (p.faqs as Faq[] | null) ?? undefined,
    outfitCategories: p.outfitCategories.length ? p.outfitCategories : undefined,
    outfitTitle: p.outfitTitle ?? undefined,
    related: p.related.length ? p.related : undefined,
    canonical: p.canonical ?? undefined,
    body: p.body,
    data: p.data,
    translations: Object.fromEntries(
      p.translations.map((t) => [
        t.locale,
        {
          title: t.title,
          excerpt: t.excerpt,
          category: t.category,
          outfitTitle: t.outfitTitle,
          faqs: (t.faqs as Faq[] | null) ?? null,
          body: t.body,
          data: t.data,
          card: (t.card as PageLocaleContent["card"]) ?? null,
        },
      ]),
    ),
  };
}

/** Page publiée par slug (article ou landing). */
export async function getPage(slug: string): Promise<ContentPage | undefined> {
  const row = (await loadAll()).find((p) => p.slug === slug);
  return row ? toPage(row) : undefined;
}

/** Articles publiés, dans l'ordre éditorial. */
export async function getArticles(): Promise<ContentPage[]> {
  return (await loadAll()).filter((p) => p.kind === "article").map(toPage);
}

/** Landings SEO publiées. */
export async function getLandings(): Promise<ContentPage[]> {
  return (await loadAll()).filter((p) => p.kind === "landing").map(toPage);
}

/**
 * Articles « à lire ensuite » : liens explicites, puis même rubrique, puis le
 * reste (maillage interne).
 */
export async function getRelatedArticles(slug: string, n = 3): Promise<ContentPage[]> {
  const all = await getArticles();
  const bySlug = new Map(all.map((a) => [a.slug, a]));
  const current = bySlug.get(slug);
  const out: ContentPage[] = [];
  const seen = new Set<string>([slug]);
  const push = (a?: ContentPage) => {
    if (a && !seen.has(a.slug)) {
      seen.add(a.slug);
      out.push(a);
    }
  };
  current?.related?.forEach((s) => push(bySlug.get(s)));
  if (current) all.filter((a) => a.category === current.category).forEach(push);
  all.forEach(push);
  return out.slice(0, n);
}

/** Carte du journal dans la langue demandée. */
export function articleCard(a: ContentPage, locale: Locale) {
  const card = locale === "fr" ? null : a.translations[locale]?.card;
  return {
    slug: a.slug,
    title: card?.title ?? a.title,
    excerpt: card?.excerpt ?? a.excerpt,
    category: card?.category ?? a.category,
    image: a.image,
  };
}

/** Configuration d'une landing SEO dans la langue demandée. */
export function landingConfig(p: ContentPage, locale: Locale): SeoLandingConfig | undefined {
  const data = (locale === "fr" ? p.data : (p.translations[locale]?.data ?? p.data)) as
    | SeoLandingConfig
    | null;
  return data ? { ...data, slug: p.slug } : undefined;
}

/** Réglage de la boutique (table Setting), avec valeur de repli. */
export const getSetting = cache(async <T,>(key: string, fallback: T): Promise<T> => {
  const row = await prisma.setting.findUnique({ where: { key } });
  return (row?.value as T | undefined) ?? fallback;
});

export interface JournalSettings {
  featured?: string;
  hubs: { title: Partial<Record<Locale, string>>; slugs: string[] }[];
  copy: Partial<Record<Locale, Record<string, string>>>;
}
