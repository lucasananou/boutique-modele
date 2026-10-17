#!/usr/bin/env node
/*
 * Importe les contenus initiaux d'une boutique (content/<STORE_ID>/*.json) dans
 * SA base : catégories (URL, SEO, FAQ, image), pages (articles, landings) et
 * réglages. Lancé au démarrage (`npm start`), idempotent :
 *   - une catégorie n'est complétée que si son `urlSlug` est vide (jamais
 *     importée) ; une catégorie absente est créée si le fichier donne son nom ;
 *   - une page n'est créée que si son slug n'existe pas ;
 *   - un réglage n'est créé que s'il n'existe pas ;
 *   - un produit (products.json, avec variantes, images, détails) n'est créé
 *     que si son slug n'existe pas : prix et stocks se gèrent ensuite dans l'admin.
 * Les modifications faites ensuite dans l'admin ne sont donc jamais écrasées.
 * `--force` réécrit tout depuis les fichiers (à n'utiliser qu'en connaissance
 * de cause). `--dry-run` n'écrit rien et affiche ce qui serait fait.
 */
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const { PrismaClient } = require("../src/generated/prisma");

const FORCE = process.argv.includes("--force");
const DRY = process.argv.includes("--dry-run");
const storeId = (process.env.NEXT_PUBLIC_STORE_ID || "demo").trim().toLowerCase();
const dir = path.join(__dirname, "..", "content", storeId);

function read(name) {
  const file = path.join(dir, name);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
}

const fill = (tpl, name) => (typeof tpl === "string" ? tpl.replaceAll("{name}", name) : tpl ?? null);
const json = (v) => (v === null || v === undefined ? undefined : v);

async function syncCategories(prisma, cats, log) {
  for (const c of cats) {
    let cat = await prisma.category.findUnique({ where: { slug: c.slug }, include: { translations: true } });
    if (!cat) {
      if (!c.name) continue;
      log(`catégorie créée : ${c.slug}`);
      if (DRY) continue;
      cat = await prisma.category.create({
        data: {
          slug: c.slug,
          name: c.name,
          description: c.description ?? "",
          imageAlt: c.imageAlt ?? c.name,
          sortOrder: c.sortOrder ?? 0,
        },
        include: { translations: true },
      });
    } else if (cat.urlSlug && !FORCE) {
      continue;
    }
    log(`catégorie complétée : ${c.slug} → /${c.urlSlug ?? c.slug}`);
    if (DRY) continue;
    await prisma.category.update({
      where: { id: cat.id },
      data: {
        urlSlug: c.urlSlug ?? c.slug,
        seoTitle: fill(c.seoTitle, cat.name),
        seoHeading: fill(c.seoHeading, cat.name),
        seoText: c.seoText ?? null,
        faqs: json(c.faqs),
        ...(c.imageSrc ? { image: c.imageSrc } : {}),
      },
    });
    for (const [locale, tr] of Object.entries(c.translations ?? {})) {
      const existing = cat.translations.find((t) => t.locale === locale);
      const name = existing?.name ?? cat.name;
      const data = {
        seoTitle: fill(tr.seoTitle, name),
        seoHeading: fill(tr.seoHeading, name),
        seoText: tr.seoText ?? null,
        faqs: json(tr.faqs),
        imageAlt: tr.imageAlt ?? null,
      };
      if (existing) {
        await prisma.categoryTranslation.update({ where: { id: existing.id }, data });
      } else {
        // Même rendu qu'avant : sans traduction, le nom et la description
        // français étaient affichés.
        await prisma.categoryTranslation.create({
          data: { categoryId: cat.id, locale, name: cat.name, description: cat.description, ...data },
        });
      }
    }
  }
}

async function syncPages(prisma, pages, log) {
  for (const p of pages) {
    const existing = await prisma.page.findUnique({ where: { slug: p.slug } });
    if (existing && !FORCE) continue;
    log(`page ${existing ? "réécrite" : "créée"} : /${p.slug} (${p.kind})`);
    if (DRY) continue;
    const { translations = {}, ...fields } = p;
    const data = {
      kind: fields.kind ?? "article",
      status: fields.status ?? "published",
      title: fields.title,
      excerpt: fields.excerpt ?? "",
      category: fields.category ?? "",
      image: fields.image ?? "",
      author: fields.author ?? null,
      publishedAt: fields.publishedAt ?? null,
      contentUpdatedAt: fields.contentUpdatedAt ?? null,
      readingMinutes: fields.readingMinutes ?? null,
      faqs: json(fields.faqs),
      outfitCategories: fields.outfitCategories ?? [],
      outfitTitle: fields.outfitTitle ?? null,
      related: fields.related ?? [],
      canonical: fields.canonical ?? null,
      body: fields.body ?? "",
      data: json(fields.data),
      sortOrder: fields.sortOrder ?? 0,
    };
    const page = existing
      ? await prisma.page.update({ where: { id: existing.id }, data })
      : await prisma.page.create({ data: { slug: p.slug, ...data } });
    for (const [locale, tr] of Object.entries(translations)) {
      const trData = {
        title: tr.title ?? null,
        excerpt: tr.excerpt ?? null,
        category: tr.category ?? null,
        outfitTitle: tr.outfitTitle ?? null,
        faqs: json(tr.faqs),
        body: tr.body ?? null,
        data: json(tr.data),
        card: json(tr.card),
      };
      await prisma.pageTranslation.upsert({
        where: { pageId_locale: { pageId: page.id, locale } },
        update: trData,
        create: { pageId: page.id, locale, ...trData },
      });
    }
  }
}

async function syncSettings(prisma, settings, log) {
  for (const [key, value] of Object.entries(settings)) {
    const existing = await prisma.setting.findUnique({ where: { key } });
    if (existing && !FORCE) continue;
    log(`réglage ${existing ? "réécrit" : "créé"} : ${key}`);
    if (DRY) continue;
    await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }
}

async function syncProducts(prisma, products, log) {
  for (const p of products) {
    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (existing && !FORCE) continue;
    if (existing && FORCE) {
      log(`produit ${p.slug} : déjà présent, --force ne réécrit pas un produit (admin > Produits)`);
      continue;
    }
    log(`produit créé : ${p.slug} (${(p.variants ?? []).length} variante(s))`);
    if (DRY) continue;
    const category =
      (await prisma.category.findUnique({ where: { slug: p.category.slug } })) ??
      (await prisma.category.create({
        data: { slug: p.category.slug, name: p.category.name, description: p.category.name, imageAlt: p.category.name },
      }));
    const collection =
      (await prisma.collection.findUnique({ where: { slug: p.collection.slug } })) ??
      (await prisma.collection.create({
        data: {
          slug: p.collection.slug,
          name: p.collection.name,
          tagline: p.collection.name,
          description: p.collection.name,
          heroImageAlt: p.collection.name,
        },
      }));
    const product = await prisma.product.create({
      data: {
        slug: p.slug,
        name: p.name,
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        sku: p.sku,
        categoryId: category.id,
        collectionId: collection.id,
        materialLabel: p.materialLabel ?? "",
        shortDescription: p.shortDescription ?? "",
        description: p.description ?? "",
        seoTitle: p.seoTitle ?? null,
        seoDescription: p.seoDescription ?? null,
        stock: p.stock ?? 0,
        status: p.status ?? "active",
        catalogVisible: p.catalogVisible ?? true,
        sortOrder: p.sortOrder ?? 0,
        details: { create: (p.details ?? []).map((d, i) => ({ label: d.label, value: d.value, sortOrder: i })) },
        images: { create: (p.images ?? []).map((im, i) => ({ src: im.src, alt: im.alt, sortOrder: i })) },
      },
    });
    for (const [i, v] of (p.variants ?? []).entries()) {
      await prisma.productVariant.create({
        data: {
          productId: product.id,
          key: v.key,
          label: v.label,
          sku: v.sku ?? null,
          optionName: v.optionName ?? "Option",
          optionValue: v.optionValue ?? v.label,
          stock: v.stock ?? 0,
          priceDelta: v.priceDelta ?? 0,
          units: v.units ?? 1,
          available: v.available ?? true,
          sortOrder: i,
        },
      });
    }
  }
}

async function main() {
  if (!fs.existsSync(dir)) {
    console.log(`[contenus] aucun dossier content/${storeId} : rien à importer`);
    return;
  }
  const prisma = new PrismaClient();
  const lines = [];
  const log = (l) => lines.push(l);
  try {
    const cats = read("categories.json");
    const pages = read("pages.json");
    const settings = read("settings.json");
    const products = read("products.json");
    if (cats) await syncCategories(prisma, cats, log);
    if (pages) await syncPages(prisma, pages, log);
    if (settings) await syncSettings(prisma, settings, log);
    if (products) await syncProducts(prisma, products, log);
  } finally {
    await prisma.$disconnect();
  }
  console.log(
    `[contenus] ${storeId}${DRY ? " (simulation)" : ""} : ${lines.length ? `${lines.length} opération(s)` : "à jour"}`,
  );
  for (const l of lines) console.log("  - " + l);
}

main().catch((e) => {
  console.error("[contenus] échec :", e);
  process.exit(1);
});
