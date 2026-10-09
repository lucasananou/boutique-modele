import { notFound } from "next/navigation";
import { getAdminCategories, getAdminProduct } from "@/lib/adminData";
import { centsToInput } from "@/lib/format";
import { ProductEditForm } from "@/components/admin/ProductEditForm";

export const metadata = { title: "Édition produit" };

export default async function AdminProductEdit({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [p, categories] = await Promise.all([
    getAdminProduct(id),
    getAdminCategories(),
  ]);
  if (!p) notFound();

  return (
    <ProductEditForm
      initial={{
        id: p.id,
        slug: p.slug,
        name: p.name,
        description: p.description,
        sourceUrl: p.sourceUrl,
        seoTitle: p.seoTitle,
        seoDescription: p.seoDescription,
        // Prix exact au centime (69,90 reste 69,90 à l'enregistrement).
        price: centsToInput(p.price),
        stock: String(p.stock),
        status: p.status,
        categoryId: p.categoryId,
        sku: p.sku,
        images: p.images,
        variants: p.variants.map((v) => ({
          id: v.id,
          label: v.label,
          available: v.available,
          sku: v.sku,
          colorName: v.colorName,
          sizeLabel: v.sizeLabel,
          stock: v.stock,
          imageId: p.images.find((image) => image.variantId === v.id)?.id,
        })),
      }}
      categories={categories}
    />
  );
}
