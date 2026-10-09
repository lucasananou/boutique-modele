import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomerDetail, initials, formatSince } from "@/lib/adminData";
import { formatPrice } from "@/lib/format";
import { statusMeta } from "@/lib/adminStatus";
import { Card, StatusPill, Mono, MetricCard, SectionHeading } from "@/components/admin/ui";

export const metadata = { title: "Fiche client" };

export default async function AdminCustomerDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const c = await getCustomerDetail(decodeURIComponent(id));
  if (!c) notFound();

  return (
    <div>
      <Link
        href="/admin/clients"
        className="flex items-center gap-1.5 text-[13px] font-medium mb-[22px]"
        style={{ color: "rgba(20,21,26,0.55)" }}
      >
        ‹ Clients
      </Link>

      <div className="flex items-center gap-4 mb-[30px]">
        <span
          className="w-[54px] h-[54px] rounded-full flex items-center justify-center text-[18px] font-semibold"
          style={{ background: "#14151A", color: "#FBFAF8" }}
        >
          {initials(c.name)}
        </span>
        <div>
          <h1 className="m-0 text-[25px] font-semibold tracking-[-0.02em]">{c.name}</h1>
          <div className="text-[13.5px] mt-1" style={{ color: "rgba(20,21,26,0.5)" }}>
            {c.email}
            {c.phone ? ` · ${c.phone}` : ""}
            {c.hasAccount ? " · compte client" : " · sans compte (commandes en invitée)"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-3.5">
        <MetricCard label="Total dépensé" value={formatPrice(c.spent)} />
        <MetricCard
          label="Commandes payées"
          value={
            c.refundedCount
              ? `${c.orderCount} (+${c.refundedCount} remboursée${c.refundedCount > 1 ? "s" : ""})`
              : String(c.orderCount)
          }
        />
        <MetricCard label="Client depuis" value={formatSince(c.since)} />
      </div>

      {c.address && (
        <Card className="px-[22px] py-4 mb-3.5">
          <SectionHeading>Dernière adresse de livraison</SectionHeading>
          <div className="text-[13px] mt-2 leading-[1.6]" style={{ color: "rgba(20,21,26,0.6)" }}>
            {c.address.name}
            <br />
            {c.address.line1}
            <br />
            {c.address.zip} {c.address.city} {c.address.country}
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="px-[22px] pt-[17px] pb-3.5">
          <SectionHeading>Historique des commandes</SectionHeading>
        </div>
        {c.orders.length === 0 ? (
          <div
            className="px-[22px] py-[34px] text-center text-[13px]"
            style={{ color: "rgba(20,21,26,0.45)", borderTop: "1px solid rgba(20,21,26,0.06)" }}
          >
            Aucune commande pour l&apos;instant.
          </div>
        ) : (
          c.orders.map((o) => {
            const m = statusMeta(o.status);
            return (
              <Link
                key={o.id}
                href={`/admin/commandes/${o.id}`}
                className="flex items-center justify-between gap-3.5 px-[22px] py-[13px] hover:bg-[rgba(20,21,26,0.02)] transition-colors"
                style={{ borderTop: "1px solid rgba(20,21,26,0.06)" }}
              >
                <div className="min-w-0">
                  <Mono className="text-[13px] font-medium block">{o.reference}</Mono>
                  <span className="text-[11.5px]" style={{ color: "rgba(20,21,26,0.42)" }}>
                    {o.date.toLocaleDateString("fr-FR")}
                    {" · "}
                    {o.items
                      .map((it) => `${it.quantity > 1 ? `${it.quantity} × ` : ""}${it.name}${it.variant ? ` (${it.variant})` : ""}`)
                      .join(", ")}
                  </span>
                </div>
                <div className="flex items-center gap-3.5 shrink-0">
                  <StatusPill label={m.label} bg={m.bg} fg={m.fg} />
                  <Mono className="text-[13px] font-medium w-[72px] text-right">
                    {formatPrice(o.total)}
                  </Mono>
                </div>
              </Link>
            );
          })
        )}
      </Card>

      {c.abandonedCarts.length > 0 && (
        <Card className="overflow-hidden mt-3.5">
          <div className="px-[22px] pt-[17px] pb-3.5">
            <SectionHeading>Paniers non payés ({c.abandonedCarts.length})</SectionHeading>
          </div>
          {c.abandonedCarts.map((o) => (
            <Link
              key={o.id}
              href={`/admin/commandes/${o.id}`}
              className="flex items-center justify-between gap-3.5 px-[22px] py-[11px] text-[12.5px]"
              style={{ borderTop: "1px solid rgba(20,21,26,0.06)", color: "rgba(20,21,26,0.55)" }}
            >
              <span>
                <Mono>{o.reference}</Mono> · {o.date.toLocaleDateString("fr-FR")}
              </span>
              <Mono>{formatPrice(o.total)}</Mono>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
