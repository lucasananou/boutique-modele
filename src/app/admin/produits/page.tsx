import { getAdminProducts } from "@/lib/adminData";
import { PageTitle } from "@/components/admin/ui";
import { ProductTable } from "@/components/admin/ProductTable";
import { createProductDraft } from "@/app/admin/actions";

export const metadata = { title: "Produits" };
export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await getAdminProducts();

  return (
    <div>
      <PageTitle
        title="Produits"
        subtitle={`${products.length} pièces au catalogue`}
        action={
          <form action={createProductDraft}>
            <button
              type="submit"
              className="text-[13px] font-medium px-4 py-2.5 rounded-[10px] cursor-pointer transition-opacity hover:opacity-90"
              style={{ background: "#14151A", color: "#FBFAF8" }}
            >
              + Nouveau produit
            </button>
          </form>
        }
      />
      <ProductTable products={products} />
    </div>
  );
}
