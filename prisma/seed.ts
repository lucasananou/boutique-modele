/*
 * Seed de DÉMONSTRATION : peuple une base vide avec le catalogue neutre de
 * src/data (1 collection, 2 catégories, 3 produits, 1 code promo).
 * ⚠️ Purge les produits existants : ne jamais lancer sur une base en production.
 * Lancer : npm run db:seed
 */
import { PrismaClient } from "../src/generated/prisma";
import { products } from "../src/data/products";
import { collections, categories, materials } from "../src/data/taxonomy";
import { categoryImage, collectionImage } from "../src/lib/images";

const prisma = new PrismaClient();

async function main() {
  // Collections
  for (const [i, c] of collections.entries()) {
    const heroSrc = collectionImage[c.slug] ?? c.heroImage.src;
    await prisma.collection.upsert({
      where: { slug: c.slug },
      update: {
        name: c.name,
        season: c.season,
        tagline: c.tagline,
        description: c.description,
        heroImageSrc: heroSrc,
        heroImageAlt: c.heroImage.alt,
        sortOrder: i,
      },
      create: {
        slug: c.slug,
        name: c.name,
        season: c.season,
        tagline: c.tagline,
        description: c.description,
        heroImageSrc: heroSrc,
        heroImageAlt: c.heroImage.alt,
        sortOrder: i,
      },
    });
  }

  // Catégories
  for (const [i, c] of categories.entries()) {
    const imgSrc = categoryImage[c.slug] ?? c.image.src;
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {
        name: c.name,
        description: c.description,
        imageSrc: imgSrc,
        imageAlt: c.image.alt,
        sortOrder: i,
      },
      create: {
        slug: c.slug,
        name: c.name,
        description: c.description,
        imageSrc: imgSrc,
        imageAlt: c.image.alt,
        sortOrder: i,
      },
    });
  }

  // Tissus / matières
  for (const [i, m] of materials.entries()) {
    await prisma.material.upsert({
      where: { slug: m.slug },
      update: { name: m.name, description: m.description, sortOrder: i },
      create: {
        slug: m.slug,
        name: m.name,
        description: m.description,
        sortOrder: i,
      },
    });
  }

  // Purge complète du catalogue avant recréation (évite tout conflit de SKU lors
  // d'un reseed). Cascade sur variantes/images/détails. Les commandes gardent
  // leur snapshot (OrderItem n'a pas de FK vers Product).
  await prisma.product.deleteMany({});

  // Produits
  for (const [i, p] of products.entries()) {
    const sku = `DEMO-${String(i + 1).padStart(3, "0")}`;
    const availableVariants = p.variants.filter((v) => v.available).length;
    // Stock de démo : pièces limitées en faible quantité (urgence réelle),
    // sinon 5 unités par taille disponible.
    const stock = !p.inStock
      ? 0
      : p.limited
        ? 3
        : (availableVariants || 1) * 5;
    const status = p.inStock ? "active" : "archived";

    const category = await prisma.category.findUnique({
      where: { slug: p.category },
    });
    const collection = await prisma.collection.findUnique({
      where: { slug: p.collection },
    });
    if (!category || !collection) {
      throw new Error(`Taxonomie manquante pour ${p.slug}`);
    }

    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        sku,
        categoryId: category.id,
        collectionId: collection.id,
        materialLabel: p.materialLabel,
        shortDescription: p.shortDescription,
        description: p.description,
        badge: p.badge,
        iconic: p.iconic ?? false,
        limited: p.limited ?? false,
        stock,
        status,
        sortOrder: i,
        materials: {
          set: [],
          connect: p.materials.map((slug) => ({ slug })),
        },
      },
      create: {
        slug: p.slug,
        name: p.name,
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        sku,
        categoryId: category.id,
        collectionId: collection.id,
        materialLabel: p.materialLabel,
        shortDescription: p.shortDescription,
        description: p.description,
        badge: p.badge,
        iconic: p.iconic ?? false,
        limited: p.limited ?? false,
        stock,
        status,
        sortOrder: i,
        materials: { connect: p.materials.map((slug) => ({ slug })) },
      },
    });

    const dbProduct = await prisma.product.findUnique({
      where: { slug: p.slug },
    });
    if (!dbProduct) continue;

    await prisma.productVariant.deleteMany({ where: { productId: dbProduct.id } });
    await prisma.productImage.deleteMany({ where: { productId: dbProduct.id } });
    await prisma.productDetail.deleteMany({ where: { productId: dbProduct.id } });

    if (p.variants.length) {
      await prisma.productVariant.createMany({
        data: p.variants.map((v, vi) => ({
          productId: dbProduct.id,
          key: v.id,
          label: v.label,
          priceDelta: v.priceDelta ?? 0,
          available: v.available,
          sortOrder: vi,
        })),
      });
    }

    // Visuels : src vide = emplacement dessiné (ProductImage), en attendant les photos.
    if (p.images.length) {
      await prisma.productImage.createMany({
        data: p.images.map((img, ii) => ({
          productId: dbProduct.id,
          src: img.src,
          alt: img.alt,
          sortOrder: ii,
        })),
      });
    }
    if (p.details.length) {
      await prisma.productDetail.createMany({
        data: p.details.map((d, di) => ({
          productId: dbProduct.id,
          label: d.label,
          value: d.value,
          sortOrder: di,
        })),
      });
    }
  }

  // Promotions de démonstration (codes appliqués au checkout)
  const promos = [
    {
      code: "BIENVENUE10",
      kind: "percent",
      value: 10,
      minSubtotal: 0,
      detail: "−10% sur votre première commande · sans minimum",
      active: true,
    },
  ];
  for (const promo of promos) {
    await prisma.promotion.upsert({
      where: { code: promo.code },
      update: promo,
      create: promo,
    });
  }

  // Vente flash (countdown pilotable) — créée INACTIVE : à activer dans l'admin.
  const endsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const existingSale = await prisma.flashSale.findFirst();
  if (existingSale) {
    await prisma.flashSale.update({
      where: { id: existingSale.id },
      data: { label: "Ventes flash", percent: 30, endsAt, active: false },
    });
  } else {
    await prisma.flashSale.create({
      data: { label: "Ventes flash", percent: 30, endsAt, active: false },
    });
  }

  const counts = {
    products: await prisma.product.count(),
    collections: await prisma.collection.count(),
    categories: await prisma.category.count(),
    materials: await prisma.material.count(),
    promotions: await prisma.promotion.count(),
    flashSales: await prisma.flashSale.count(),
  };
  console.log("✓ Catalogue seedé :", counts);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
