import Link from "next/link";
import { getOrders } from "@/lib/adminData";
import { formatPrice } from "@/lib/format";
import { statusMeta, orderFilters } from "@/lib/adminStatus";
import { Card, PageTitle, StatusPill, Mono } from "@/components/admin/ui";

export const metadata = { title: "Commandes" };

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; q?: string; page?: string }>;
}) {
  const { statut, q, page } = await searchParams;
  const filter = statut ?? "all";
  const search = q?.trim() ?? "";
  const result = await getOrders(filter, search, Number(page) || 1);
  const orders = result.orders;
  const href = (params: { statut?: string; page?: number }) => {
    const sp = new URLSearchParams();
    const st = params.statut ?? filter;
    if (st && st !== "all") sp.set("statut", st);
    if (search) sp.set("q", search);
    if (params.page && params.page > 1) sp.set("page", String(params.page));
    const qs = sp.toString();
    return qs ? `/admin/commandes?${qs}` : "/admin/commandes";
  };

  return (
    <div>
      <PageTitle
        title="Commandes"
        subtitle={`${result.total} commande${result.total > 1 ? "s" : ""}${search ? ` pour « ${search} »` : ""}`}
      />

      <form action="/admin/commandes" method="get" className="flex gap-2 mb-[14px]">
        {filter !== "all" && <input type="hidden" name="statut" value={filter} />}
        <input
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Rechercher : référence, e-mail, nom, n° de suivi…"
          aria-label="Rechercher une commande"
          className="flex-1 text-[14px] px-3.5 py-[10px] rounded-[11px]"
          style={{ background: "#fff", border: "1px solid rgba(20,21,26,0.1)" }}
        />
        <button
          type="submit"
          className="text-[13px] font-medium px-4 rounded-[11px]"
          style={{ background: "#14151A", color: "#FBFAF8" }}
        >
          Rechercher
        </button>
        {search && (
          <Link
            href={filter !== "all" ? `/admin/commandes?statut=${filter}` : "/admin/commandes"}
            className="text-[13px] self-center px-2"
            style={{ color: "rgba(20,21,26,0.55)" }}
          >
            Effacer
          </Link>
        )}
      </form>

      <div className="flex gap-2 mb-[18px] flex-wrap">
        {orderFilters.map((f) => {
          const active = filter === f.key;
          return (
            <Link
              key={f.key}
              href={href({ statut: f.key })}
              className="text-[12.5px] font-medium px-3.5 py-[7px] rounded-full transition-colors"
              style={{
                background: active ? "#14151A" : "#fff",
                color: active ? "#FBFAF8" : "rgba(20,21,26,0.6)",
                border: `1px solid ${active ? "#14151A" : "rgba(20,21,26,0.12)"}`,
              }}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <Card className="overflow-hidden">
        <div
          className="grid grid-cols-[90px_1fr_120px_110px_90px] gap-3.5 px-5 py-3 text-[10.5px] tracking-[0.1em] uppercase"
          style={{
            fontFamily: "var(--font-geist-mono), monospace",
            color: "rgba(20,21,26,0.4)",
            borderBottom: "1px solid rgba(20,21,26,0.07)",
          }}
        >
          <span>N°</span>
          <span>Client</span>
          <span>Date</span>
          <span>Statut</span>
          <span className="text-right">Total</span>
        </div>

        {orders.length === 0 ? (
          <div
            className="px-5 py-16 text-center text-[13.5px]"
            style={{ color: "rgba(20,21,26,0.5)" }}
          >
            {search
              ? "Aucune commande ne correspond à cette recherche."
              : "Aucune commande dans cette catégorie."}
          </div>
        ) : (
          orders.map((o) => {
            const m = statusMeta(o.status);
            return (
              <Link
                key={o.id}
                href={`/admin/commandes/${o.id}`}
                className="grid grid-cols-[90px_1fr_120px_110px_90px] gap-3.5 items-center px-5 py-3.5 hover:bg-[rgba(20,21,26,0.02)] transition-colors"
                style={{ borderTop: "1px solid rgba(20,21,26,0.06)" }}
              >
                <Mono className="text-[13px] font-medium">{o.reference}</Mono>
                <span className="text-[13.5px] font-medium truncate">
                  {o.customer}
                </span>
                <span className="text-[13px]" style={{ color: "rgba(20,21,26,0.55)" }}>
                  {o.date.toLocaleDateString("fr-FR")}
                </span>
                <span>
                  <StatusPill label={m.label} bg={m.bg} fg={m.fg} />
                </span>
                <Mono className="text-[13px] font-medium text-right">
                  {formatPrice(o.total)}
                </Mono>
              </Link>
            );
          })
        )}
      </Card>

      {result.pages > 1 && (
        <div className="flex items-center justify-between mt-4 text-[13px]">
          <span style={{ color: "rgba(20,21,26,0.5)" }}>
            Page {result.page} / {result.pages}
          </span>
          <div className="flex gap-2">
            {result.page > 1 && (
              <Link href={href({ page: result.page - 1 })} className="px-3 py-1.5 rounded-full" style={{ border: "1px solid rgba(20,21,26,0.12)" }}>
                ‹ Précédente
              </Link>
            )}
            {result.page < result.pages && (
              <Link href={href({ page: result.page + 1 })} className="px-3 py-1.5 rounded-full" style={{ border: "1px solid rgba(20,21,26,0.12)" }}>
                Suivante ›
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
