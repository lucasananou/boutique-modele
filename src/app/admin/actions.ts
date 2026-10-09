"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { destroyFromCloudinary } from "@/lib/cloudinary";
import {
  sendShippingNotice,
  sendCartReminder,
  type ReminderStep,
} from "@/lib/email";
import type { OrderStatusKey } from "@/lib/adminStatus";
import { parseEuroInput } from "@/lib/format";
import { carriers, carrierLabel, trackingLink } from "@/lib/carriers";
import { store } from "@/stores";
import type { Locale } from "@/lib/i18n";

const allowed: OrderStatusKey[] = [
  "PENDING",
  "PAID",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  // Marquage manuel (remboursement fait dans Stripe sans webhook reçu) :
  // ne déclenche AUCUN remboursement.
  "REFUNDED",
];

export async function updateOrderStatus(orderId: string, status: string) {
  await requireAdmin();
  if (!allowed.includes(status as OrderStatusKey)) {
    return { error: "Statut invalide" };
  }
  const before = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true, shippedAt: true },
  });
  if (!before) return { error: "Commande introuvable" };

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: status as OrderStatusKey,
      ...(status === "SHIPPED" && !before.shippedAt
        ? { shippedAt: new Date() }
        : {}),
    },
    include: { items: true },
  });

  // Notification d'expédition au client (no-op si Resend non configuré),
  // avec le suivi colis s'il a été saisi.
  if (status === "SHIPPED" && before.status !== "SHIPPED") {
    await notifyShipped(order);
  }

  revalidateOrder(orderId);
  return { ok: true };
}

type OrderWithItems = Awaited<
  ReturnType<typeof prisma.order.findUniqueOrThrow<{ where: { id: string }; include: { items: true } }>>
>;

async function notifyShipped(order: OrderWithItems) {
  await sendShippingNotice({
    reference: order.reference,
    email: order.email,
    amountTotal: order.amountTotal,
    shippingName: order.shippingName,
    locale: order.locale as Locale,
    items: order.items,
    tracking: order.trackingNumber
      ? {
          carrier: carrierLabel(order.trackingCarrier),
          number: order.trackingNumber,
          url: trackingLink(
            order.trackingCarrier,
            order.trackingNumber,
            order.trackingUrl,
          ),
        }
      : undefined,
  });
}

function revalidateOrder(orderId: string) {
  revalidatePath(`/admin/commandes/${orderId}`);
  revalidatePath("/admin/commandes");
  revalidatePath("/admin/clients");
  revalidatePath("/admin");
}

export interface TrackingInput {
  carrier: string;
  number: string;
  /** Lien de suivi (utile pour « autre transporteur »). */
  url?: string;
  /**
   * "save" = enregistrer seulement ; "ship" = enregistrer, passer la commande
   * en Expédiée et prévenir la cliente ; "resend" = enregistrer et renvoyer
   * l'e-mail d'expédition (commande déjà expédiée).
   */
  mode: "save" | "ship" | "resend";
}

/** Enregistre le transporteur et le n° de suivi d'une commande. */
export async function saveOrderTracking(orderId: string, data: TrackingInput) {
  await requireAdmin();
  const carrier = data.carrier.trim();
  const number = data.number.trim();
  const url = data.url?.trim() || null;
  if (!carriers.some((c) => c.key === carrier)) {
    return { error: "Transporteur inconnu" };
  }
  if (!number || number.length > 80) {
    return { error: "Numéro de suivi invalide" };
  }
  if (url && !/^https?:\/\//i.test(url)) {
    return { error: "Le lien de suivi doit commencer par https://" };
  }

  const before = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true, shippedAt: true },
  });
  if (!before) return { error: "Commande introuvable" };
  if (data.mode === "ship" && !["PAID", "SHIPPED"].includes(before.status)) {
    return { error: "Seule une commande payée peut être expédiée" };
  }

  const ship = data.mode === "ship" && before.status !== "SHIPPED";
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      trackingCarrier: carrier,
      trackingNumber: number,
      trackingUrl: url,
      ...(ship ? { status: "SHIPPED" as const } : {}),
      ...(ship && !before.shippedAt ? { shippedAt: new Date() } : {}),
    },
    include: { items: true },
  });

  if (ship || (data.mode === "resend" && order.status === "SHIPPED")) {
    await notifyShipped(order);
  }

  revalidateOrder(orderId);
  return { ok: true, notified: ship || data.mode === "resend" };
}

export interface ProductInput {
  name: string;
  slug?: string;
  description: string;
  seoTitle?: string;
  seoDescription?: string;
  /** Prix en euros (saisi par l'admin, ex. « 69,90 ») → converti en centimes. */
  price: string;
  stock: string;
  status: string;
  sku: string;
  /** Identifiant de la catégorie (liste déroulante). Absent = inchangée. */
  categoryId?: string;
}

export interface ProductVariantInput {
  label: string;
  sku?: string;
  colorName?: string;
  sizeLabel?: string;
  stock?: string;
  available?: boolean;
  imageId?: string;
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Brouillon produit : première catégorie / collection existante ; si la base
// est vide (boutique neuve), création de celles de la config boutique.
async function defaultCategoryId() {
  const existing =
    (await prisma.category.findUnique({
      where: { slug: store.defaultCategory.slug },
      select: { id: true },
    })) ??
    (await prisma.category.findFirst({
      orderBy: { sortOrder: "asc" },
      select: { id: true },
    }));
  if (existing) return existing.id;

  const { slug, name } = store.defaultCategory;
  const created = await prisma.category.create({
    data: { slug, name, description: name, imageAlt: name, sortOrder: 10 },
    select: { id: true },
  });
  return created.id;
}

async function defaultCollectionId() {
  const existing =
    (await prisma.collection.findUnique({
      where: { slug: store.defaultCollection.slug },
      select: { id: true },
    })) ??
    (await prisma.collection.findFirst({
      orderBy: { sortOrder: "asc" },
      select: { id: true },
    }));
  if (existing) return existing.id;

  const { slug, name } = store.defaultCollection;
  const created = await prisma.collection.create({
    data: {
      slug,
      name,
      tagline: name,
      description: name,
      heroImageAlt: name,
      sortOrder: 10,
    },
    select: { id: true },
  });
  return created.id;
}

export async function createProductDraft() {
  await requireAdmin();

  const suffix = Date.now().toString(36);
  const [categoryId, collectionId] = await Promise.all([
    defaultCategoryId(),
    defaultCollectionId(),
  ]);

  const product = await prisma.product.create({
    data: {
      name: "Nouveau produit",
      slug: `nouveau-produit-${suffix}`,
      sku: `DRAFT-${suffix}`,
      price: 0,
      stock: 0,
      status: "draft",
      categoryId,
      collectionId,
      materialLabel: "",
      shortDescription: "",
      description: "",
    },
    select: { id: true },
  });

  revalidatePath("/admin/produits");
  redirect(`/admin/produits/${product.id}`);
}

/** Persiste les modifications d'un produit (admin). */
export async function updateProduct(productId: string, data: ProductInput) {
  await requireAdmin();

  const price = parseEuroInput(data.price);
  const stock = parseInt(data.stock, 10);
  const status = ["active", "review", "draft", "archived"].includes(data.status)
    ? data.status
    : "active";
  const slug = normalizeSlug(data.slug || data.name);

  if (!data.name.trim() || !slug) {
    return { error: "Nom ou slug invalide" };
  }
  if (price === null) {
    return { error: "Prix invalide (format attendu : 69,90)" };
  }

  let categoryId: string | undefined;
  if (data.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
      select: { id: true },
    });
    if (!category) return { error: "Catégorie inconnue" };
    categoryId = category.id;
  }

  const slugOwner = await prisma.product.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (slugOwner && slugOwner.id !== productId) {
    return { error: "Ce slug est déjà utilisé par un autre produit" };
  }

  const current = await prisma.product.findUnique({
    where: { id: productId },
    select: { slug: true },
  });

  await prisma.product.update({
    where: { id: productId },
    data: {
      name: data.name.trim(),
      slug,
      description: data.description,
      seoTitle: data.seoTitle?.trim() || null,
      seoDescription: data.seoDescription?.trim() || null,
      price,
      stock: Number.isNaN(stock) ? 0 : Math.max(0, stock),
      status,
      sku: data.sku.trim(),
      ...(categoryId ? { categoryId } : {}),
    },
  });

  // Le storefront est en ISR (revalidate) ; on rafraîchit aussi l'admin.
  revalidatePath("/admin/produits");
  revalidatePath(`/admin/produits/${productId}`);
  revalidatePath("/boutique");
  if (current?.slug) revalidatePath(`/produit/${current.slug}`);
  revalidatePath(`/produit/${slug}`);
  return { ok: true };
}

/** Supprime définitivement un produit du catalogue admin/storefront. */
export async function deleteProduct(productId: string) {
  await requireAdmin();

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      slug: true,
      images: { select: { src: true } },
    },
  });
  if (!product) return { error: "Produit introuvable" };

  await prisma.product.delete({ where: { id: productId } });

  await Promise.all(
    product.images
      .filter((image) => image.src)
      .map((image) => destroyFromCloudinary(image.src)),
  );

  revalidatePath("/admin/produits");
  revalidatePath(`/admin/produits/${productId}`);
  revalidatePath("/boutique");
  revalidatePath(`/produit/${product.slug}`);
  return { ok: true };
}

/**
 * Relance manuelle d'un panier abandonné depuis le dashboard : envoie la
 * PROCHAINE relance due (reminderCount+1, plafonnée à 3), garantit le code
 * promo −10 % à l'étape 3, puis incrémente le compteur. No-op si la commande
 * n'est plus PENDING.
 */
export async function relanceCart(orderId: string) {
  await requireAdmin();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return { error: "Commande introuvable" };
  if (order.status !== "PENDING") {
    return { error: "Ce panier n'est plus en attente." };
  }
  if (order.reminderCount >= 3) {
    return { error: "Ce panier a déjà reçu les 3 relances." };
  }

  const step = (order.reminderCount + 1) as ReminderStep;

  let promoCode: string | undefined;
  if (step === 3) {
    const { cartRecoveryCode: code, cartRecoveryPercent: percent } = store.promos;
    await prisma.promotion.upsert({
      where: { code },
      update: { active: true },
      create: {
        code,
        kind: "percent",
        value: percent,
        minSubtotal: 0,
        detail: `Votre panier vous attend — ${percent} % offerts`,
        active: true,
      },
    });
    promoCode = code;
  }

  await sendCartReminder(
    {
      reference: order.reference,
      email: order.email,
      amountTotal: order.amountTotal,
      discountAmount: order.discountAmount,
      giftWrap: order.giftWrap,
      shippingName: order.shippingName,
      confirmToken: order.confirmToken,
      locale: order.locale as Locale,
      items: order.items,
      promoCode,
    },
    step,
  );

  await prisma.order.update({
    where: { id: order.id },
    data: { reminderCount: { increment: 1 }, lastReminderAt: new Date() },
  });

  revalidatePath("/admin/paniers");
  return { ok: true, step };
}

/* ============== IMAGES PRODUIT ============== */

/** Supprime une image produit : retire la ligne + suppression best-effort sur Cloudinary. */
export async function deleteProductImage(imageId: string) {
  await requireAdmin();
  const img = await prisma.productImage.findUnique({
    where: { id: imageId },
    select: { id: true, src: true, productId: true },
  });
  if (!img) return { error: "Image introuvable" };

  await prisma.productImage.delete({ where: { id: imageId } });
  if (img.src) await destroyFromCloudinary(img.src);

  revalidatePath(`/admin/produits/${img.productId}`);
  revalidatePath("/admin/produits");
  revalidatePath("/boutique");
  return { ok: true };
}

/** Définit une image comme couverture (sortOrder 0 ; les autres décalées ensuite). */
export async function setCoverImage(imageId: string) {
  await requireAdmin();
  const img = await prisma.productImage.findUnique({
    where: { id: imageId },
    select: { id: true, productId: true },
  });
  if (!img) return { error: "Image introuvable" };

  const others = await prisma.productImage.findMany({
    where: { productId: img.productId, NOT: { id: imageId } },
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });
  await prisma.$transaction([
    prisma.productImage.update({ where: { id: imageId }, data: { sortOrder: 0 } }),
    ...others.map((o, i) =>
      prisma.productImage.update({
        where: { id: o.id },
        data: { sortOrder: i + 1 },
      }),
    ),
  ]);

  revalidatePath(`/admin/produits/${img.productId}`);
  revalidatePath("/admin/produits");
  revalidatePath("/boutique");
  return { ok: true };
}

/** Associe une image produit à une variante précise, ou la remet en image générale. */
export async function setProductImageVariant(
  imageId: string,
  variantId?: string,
) {
  await requireAdmin();

  const img = await prisma.productImage.findUnique({
    where: { id: imageId },
    select: { id: true, productId: true },
  });
  if (!img) return { error: "Image introuvable" };

  if (variantId) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { productId: true },
    });
    if (!variant || variant.productId !== img.productId) {
      return { error: "Variante invalide pour ce produit" };
    }
  }

  await prisma.productImage.update({
    where: { id: imageId },
    data: { variantId: variantId || null },
  });

  revalidatePath(`/admin/produits/${img.productId}`);
  revalidatePath("/admin/produits");
  revalidatePath("/boutique");
  return { ok: true };
}

function variantKey(data: ProductVariantInput) {
  return (
    data.sku ||
    data.colorName ||
    data.sizeLabel ||
    data.label ||
    `variant-${Date.now()}`
  )
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function setVariantFeaturedImage(
  productId: string,
  variantId: string,
  imageId?: string,
) {
  if (imageId) {
    const image = await prisma.productImage.findUnique({
      where: { id: imageId },
      select: { productId: true },
    });
    if (!image || image.productId !== productId) {
      return { error: "Image invalide pour ce produit" };
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.productImage.updateMany({
      where: { productId, variantId },
      data: { variantId: null },
    });

    if (imageId) {
      await tx.productImage.update({
        where: { id: imageId },
        data: { variantId },
      });
    }
  });

  return { ok: true };
}

export async function updateProductVariant(
  variantId: string,
  data: ProductVariantInput,
) {
  await requireAdmin();

  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    select: { productId: true },
  });
  if (!variant) return { error: "Variante introuvable" };

  const stock = parseInt(data.stock ?? "0", 10);
  const label =
    data.label.trim() ||
    [data.colorName, data.sizeLabel].filter(Boolean).join(" / ") ||
    "Variante";

  await prisma.productVariant.update({
    where: { id: variantId },
    data: {
      label,
      sku: data.sku?.trim() || null,
      key: variantKey({ ...data, label }),
      optionName:
        data.colorName && data.sizeLabel
          ? "Couleur / Taille"
          : data.colorName
            ? "Couleur"
            : "Taille",
      optionValue:
        [data.colorName, data.sizeLabel].filter(Boolean).join(" / ") || label,
      colorName: data.colorName?.trim() || null,
      sizeLabel: data.sizeLabel?.trim() || null,
      stock: Number.isNaN(stock) ? 0 : Math.max(0, stock),
      available: Boolean(data.available),
    },
  });

  const imageResult = await setVariantFeaturedImage(
    variant.productId,
    variantId,
    data.imageId || undefined,
  );
  if (imageResult.error) return imageResult;

  revalidatePath(`/admin/produits/${variant.productId}`);
  revalidatePath("/admin/produits");
  revalidatePath("/boutique");
  return { ok: true };
}

export async function createProductVariant(
  productId: string,
  data: ProductVariantInput,
) {
  await requireAdmin();

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });
  if (!product) return { error: "Produit introuvable" };

  const last = await prisma.productVariant.findFirst({
    where: { productId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const stock = parseInt(data.stock ?? "0", 10);
  const label =
    data.label.trim() ||
    [data.colorName, data.sizeLabel].filter(Boolean).join(" / ") ||
    "Nouvelle variante";

  const variant = await prisma.productVariant.create({
    data: {
      productId,
      key: variantKey({ ...data, label }),
      label,
      sku: data.sku?.trim() || null,
      optionName:
        data.colorName && data.sizeLabel
          ? "Couleur / Taille"
          : data.colorName
            ? "Couleur"
            : "Taille",
      optionValue:
        [data.colorName, data.sizeLabel].filter(Boolean).join(" / ") || label,
      colorName: data.colorName?.trim() || null,
      sizeLabel: data.sizeLabel?.trim() || null,
      stock: Number.isNaN(stock) ? 0 : Math.max(0, stock),
      available: data.available ?? true,
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
    select: { id: true },
  });

  const imageResult = await setVariantFeaturedImage(
    productId,
    variant.id,
    data.imageId || undefined,
  );
  if (imageResult.error) return imageResult;

  revalidatePath(`/admin/produits/${productId}`);
  revalidatePath("/admin/produits");
  revalidatePath("/boutique");
  return { ok: true, id: variant.id };
}

export async function deleteProductVariant(variantId: string) {
  await requireAdmin();

  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    select: { productId: true },
  });
  if (!variant) return { error: "Variante introuvable" };

  await prisma.productVariant.delete({ where: { id: variantId } });

  revalidatePath(`/admin/produits/${variant.productId}`);
  revalidatePath("/admin/produits");
  revalidatePath("/boutique");
  return { ok: true };
}

/** Réordonne les images d'un produit selon la liste d'ids fournie (glisser-déposer). */
export async function reorderProductImages(
  productId: string,
  orderedIds: string[],
) {
  await requireAdmin();

  // On ne réordonne que des images appartenant réellement à ce produit.
  const owned = await prisma.productImage.findMany({
    where: { productId },
    select: { id: true },
  });
  const valid = new Set(owned.map((i) => i.id));
  const ids = orderedIds.filter((id) => valid.has(id));
  if (ids.length !== owned.length) {
    return { error: "Ordre invalide" };
  }

  await prisma.$transaction(
    ids.map((id, i) =>
      prisma.productImage.update({ where: { id }, data: { sortOrder: i } }),
    ),
  );

  revalidatePath(`/admin/produits/${productId}`);
  revalidatePath("/admin/produits");
  revalidatePath("/boutique");
  return { ok: true };
}
