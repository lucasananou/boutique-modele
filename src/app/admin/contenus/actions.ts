"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { RESERVED_SEGMENTS, normalizeSegment, textToFaqs } from "@/lib/contentAdmin";

/*
 * Server actions de l'admin des contenus : catégories (URL, SEO, FAQ, visuel)
 * et pages (articles du journal, landings). Erreur → retour au formulaire
 * avec ?erreur=… ; succès → ?ok=1.
 */

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const opt = (fd: FormData, k: string) => str(fd, k) || null;

function back(path: string, error: string): never {
  redirect(`${path}?erreur=${encodeURIComponent(error)}`);
}

/** Le segment d'URL est-il libre (catégories + pages + routes du site) ? */
async function segmentTaken(segment: string, except: { categoryId?: string; pageId?: string }) {
  if (RESERVED_SEGMENTS.has(segment)) return "réservée par le site";
  const cat = await prisma.category.findFirst({
    where: { OR: [{ urlSlug: segment }, { urlSlug: null, slug: segment }] },
    select: { id: true },
  });
  if (cat && cat.id !== except.categoryId) return "déjà utilisée par une catégorie";
  const page = await prisma.page.findUnique({ where: { slug: segment }, select: { id: true } });
  if (page && page.id !== except.pageId) return "déjà utilisée par une page";
  return null;
}

/* ============================== CATÉGORIES ============================== */

export async function saveCategory(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const path = `/admin/categories/${id || "nouvelle"}`;
  const name = str(formData, "name");
  const current = id
    ? await prisma.category.findUnique({ where: { id }, select: { slug: true } })
    : null;
  const slug = current?.slug ?? normalizeSegment(str(formData, "slug") || name);
  const urlSlug = normalizeSegment(str(formData, "urlSlug") || slug);
  if (!name || !slug) back(path, "Nom obligatoire");

  const taken = await segmentTaken(urlSlug, { categoryId: id || undefined });
  if (taken) back(path, `L'adresse /${urlSlug} est ${taken}`);

  const data = {
    name,
    description: str(formData, "description"),
    image: opt(formData, "image"),
    imageAlt: str(formData, "imageAlt") || name,
    urlSlug,
    seoTitle: opt(formData, "seoTitle"),
    seoHeading: opt(formData, "seoHeading"),
    seoText: opt(formData, "seoText"),
    faqs: textToFaqs(str(formData, "faqs")),
    sortOrder: Number.parseInt(str(formData, "sortOrder"), 10) || 0,
  };

  let savedId = id;
  if (id) {
    await prisma.category.update({ where: { id }, data });
  } else {
    const exists = await prisma.category.findUnique({ where: { slug }, select: { id: true } });
    if (exists) back(path, `Le slug « ${slug} » existe déjà`);
    savedId = (await prisma.category.create({ data: { slug, ...data }, select: { id: true } })).id;
  }
  revalidatePath("/", "layout");
  redirect(`/admin/categories/${savedId}?ok=1`);
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) back(`/admin/categories/${id}`, `Impossible : ${count} produit(s) dans cette catégorie`);
  await prisma.category.delete({ where: { id } });
  revalidatePath("/", "layout");
  redirect("/admin/categories");
}

/* ================================ PAGES ================================ */

export async function savePage(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const kind = str(formData, "kind") === "landing" ? "landing" : "article";
  const path = `/admin/contenus/${id || `nouveau?type=${kind}`}`;
  const title = str(formData, "title");
  const slug = normalizeSegment(str(formData, "slug") || title);
  if (!title || !slug) back(path, "Titre obligatoire");

  const taken = await segmentTaken(slug, { pageId: id || undefined });
  if (taken) back(path, `L'adresse /${slug} est ${taken}`);

  let data: unknown = null;
  if (kind === "landing") {
    try {
      data = JSON.parse(str(formData, "data") || "null");
    } catch {
      back(path, "Données de la landing : JSON invalide");
    }
  }

  const fields = {
    slug,
    kind,
    status: str(formData, "status") === "draft" ? "draft" : "published",
    title,
    excerpt: str(formData, "excerpt"),
    category: str(formData, "category"),
    image: str(formData, "image"),
    author: opt(formData, "author"),
    publishedAt: opt(formData, "publishedAt"),
    contentUpdatedAt: opt(formData, "contentUpdatedAt"),
    readingMinutes: Number.parseInt(str(formData, "readingMinutes"), 10) || null,
    faqs: textToFaqs(str(formData, "faqs")),
    outfitCategories: formData.getAll("outfitCategories").map(String).filter(Boolean),
    outfitTitle: opt(formData, "outfitTitle"),
    related: str(formData, "related").split(/[\s,]+/).map(normalizeSegment).filter(Boolean),
    canonical: opt(formData, "canonical"),
    body: String(formData.get("body") ?? ""),
    ...(kind === "landing" ? { data: data as object } : {}),
    sortOrder: Number.parseInt(str(formData, "sortOrder"), 10) || 0,
  };

  const saved = id
    ? await prisma.page.update({ where: { id }, data: fields, select: { id: true } })
    : await prisma.page.create({ data: fields, select: { id: true } });
  revalidatePath("/", "layout");
  redirect(`/admin/contenus/${saved.id}?ok=1`);
}

export async function deletePage(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const page = await prisma.page.findUnique({ where: { id }, select: { status: true } });
  // Une page publiée doit d'abord être dépubliée (évite une 404 par erreur).
  if (page?.status === "published") back(`/admin/contenus/${id}`, "Dépubliez la page avant de la supprimer");
  await prisma.page.delete({ where: { id } });
  revalidatePath("/", "layout");
  redirect("/admin/contenus");
}
