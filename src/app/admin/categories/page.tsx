import Link from "next/link";
import { prisma } from "@/lib/db";
import { categoryHref } from "@/lib/categories";
import { Card, Mono, PageTitle } from "@/components/admin/ui";

export const metadata = { title: "Catégories" };
export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });

  return (
    <div>
      <PageTitle
        title="Catégories"
        subtitle="Adresse publique, textes SEO, FAQ et visuel de chaque catégorie."
        action={
          <Link
            href="/admin/categories/nouvelle"
            className="text-[13px] font-medium px-4 py-2.5 rounded-[10px]"
            style={{ background: "#14151A", color: "#FBFAF8" }}
          >
            + Nouvelle catégorie
          </Link>
        }
      />
      <Card className="overflow-hidden">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/admin/categories/${c.id}`}
            className="grid grid-cols-[1fr_220px_90px_60px] gap-3.5 items-center px-5 py-3.5 hover:bg-[rgba(20,21,26,0.02)]"
            style={{ borderTop: "1px solid rgba(20,21,26,0.06)" }}
          >
            <span className="text-[13.5px] font-medium">{c.name}</span>
            <Mono className="text-[12.5px]">{categoryHref(c)}</Mono>
            <span className="text-[12.5px] text-right" style={{ color: "rgba(20,21,26,0.55)" }}>
              {c._count.products} produit{c._count.products > 1 ? "s" : ""}
            </span>
            <Mono className="text-[12px] text-right">#{c.sortOrder}</Mono>
          </Link>
        ))}
      </Card>
    </div>
  );
}
