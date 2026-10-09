import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { isAdminSession } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { uploadToCloudinary, cloudinaryConfigured } from "@/lib/cloudinary";

const MAX_BYTES = 10 * 1024 * 1024; // 10 Mo par image

/**
 * POST /api/admin/produits/[id]/images
 * Reçoit un ou plusieurs fichiers (champ « file »), les envoie sur Cloudinary
 * (upload signé côté serveur) et crée les lignes ProductImage correspondantes.
 * Route Handler (et non Server Action) pour éviter la limite de corps de 1 Mo.
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || !(await isAdminSession(session))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, name: true },
  });
  if (!product) {
    return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
  }

  if (!cloudinaryConfigured()) {
    return NextResponse.json(
      {
        error:
          "Cloudinary n'est pas configuré. Ajoute CLOUDINARY_API_KEY et CLOUDINARY_API_SECRET dans les variables d'environnement, puis redéploie.",
      },
      { status: 503 },
    );
  }

  const form = await req.formData();
  const files = form
    .getAll("file")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) {
    return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 });
  }
  for (const f of files) {
    if (!f.type.startsWith("image/")) {
      return NextResponse.json(
        { error: `« ${f.name} » n'est pas une image.` },
        { status: 400 },
      );
    }
    if (f.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `« ${f.name} » dépasse 10 Mo.` },
        { status: 400 },
      );
    }
  }

  // Les nouvelles images se placent après les existantes.
  const last = await prisma.productImage.findFirst({
    where: { productId: id },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  let order = (last?.sortOrder ?? -1) + 1;

  const created: { id: string; src: string; alt: string; variantId?: string }[] =
    [];
  try {
    for (const file of files) {
      const { src } = await uploadToCloudinary(file);
      const row = await prisma.productImage.create({
        data: { productId: id, src, alt: product.name, sortOrder: order++ },
        select: { id: true, src: true, alt: true, variantId: true },
      });
      created.push({ ...row, variantId: row.variantId ?? undefined });
    }
  } catch (e) {
    // On renvoie ce qui a réussi + l'erreur (upload partiel possible).
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Échec de l'upload",
        images: created,
      },
      { status: 502 },
    );
  }

  revalidatePath(`/admin/produits/${id}`);
  revalidatePath("/admin/produits");
  revalidatePath("/boutique");
  return NextResponse.json({ images: created });
}
