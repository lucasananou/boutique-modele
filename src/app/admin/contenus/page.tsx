import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, Mono, PageTitle, StatusPill } from "@/components/admin/ui";

export const metadata = { title: "Contenus" };
export const dynamic = "force-dynamic";

export default async function AdminPagesList({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const kind = type === "landing" ? "landing" : "article";
  const pages = await prisma.page.findMany({
    where: { kind },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, slug: true, title: true, status: true, category: true, updatedAt: true },
  });

  return (
    <div>
      <PageTitle
        title="Contenus"
        subtitle="Articles du journal et landings SEO, servis à la racine du site (/<adresse>)."
        action={
          <Link
            href={`/admin/contenus/nouveau?type=${kind}`}
            className="text-[13px] font-medium px-4 py-2.5 rounded-[10px]"
            style={{ background: "#14151A", color: "#FBFAF8" }}
          >
            + {kind === "landing" ? "Nouvelle landing" : "Nouvel article"}
          </Link>
        }
      />
      <div className="flex gap-2 mb-[18px]">
        {[
          { key: "article", label: "Articles" },
          { key: "landing", label: "Landings SEO" },
        ].map((f) => (
          <Link
            key={f.key}
            href={`/admin/contenus?type=${f.key}`}
            className="text-[12.5px] font-medium px-3.5 py-[7px] rounded-full"
            style={{
              background: kind === f.key ? "#14151A" : "#fff",
              color: kind === f.key ? "#FBFAF8" : "rgba(20,21,26,0.6)",
              border: `1px solid ${kind === f.key ? "#14151A" : "rgba(20,21,26,0.12)"}`,
            }}
          >
            {f.label}
          </Link>
        ))}
      </div>
      <Card className="overflow-hidden">
        {pages.length === 0 && (
          <div className="px-5 py-14 text-center text-[13.5px]" style={{ color: "rgba(20,21,26,0.5)" }}>
            Aucun contenu.
          </div>
        )}
        {pages.map((p) => (
          <Link
            key={p.id}
            href={`/admin/contenus/${p.id}`}
            className="grid grid-cols-[1fr_140px_100px] gap-3.5 items-center px-5 py-3.5 hover:bg-[rgba(20,21,26,0.02)]"
            style={{ borderTop: "1px solid rgba(20,21,26,0.06)" }}
          >
            <div className="min-w-0">
              <div className="text-[13.5px] font-medium truncate">{p.title}</div>
              <Mono className="text-[11.5px]" style={{ color: "rgba(20,21,26,0.45)" }}>/{p.slug}</Mono>
            </div>
            <span className="text-[12.5px]" style={{ color: "rgba(20,21,26,0.55)" }}>{p.category}</span>
            <span className="text-right">
              {p.status === "published" ? (
                <StatusPill label="Publié" bg="rgba(31,138,91,0.13)" fg="#1F7A52" />
              ) : (
                <StatusPill label="Brouillon" bg="rgba(176,118,20,0.12)" fg="#9A6608" />
              )}
            </span>
          </Link>
        ))}
      </Card>
    </div>
  );
}
