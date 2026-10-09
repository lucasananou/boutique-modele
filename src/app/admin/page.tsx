import Link from "next/link";
import { getDashboardData, initials } from "@/lib/adminData";
import { formatPrice } from "@/lib/format";
import { statusMeta } from "@/lib/adminStatus";
import {
  Card,
  PageTitle,
  MetricCard,
  StatusPill,
  Mono,
  Swatch,
  SectionHeading,
} from "@/components/admin/ui";

export default async function AdminDashboard() {
  const d = await getDashboardData();

  return (
    <div>
      <PageTitle
        title="Vue d'ensemble"
        subtitle="Votre boutique en un coup d'œil."
        action={
          <span
            className="text-[13px] font-medium px-3.5 py-2.5 rounded-[10px]"
            style={{
              border: "1px solid rgba(20,21,26,0.12)",
              background: "#fff",
              color: "rgba(20,21,26,0.62)",
            }}
          >
            Données en temps réel
          </span>
        }
      />

      {/* Métriques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-3.5">
        <MetricCard
          label="Chiffre d'affaires"
          value={formatPrice(d.metrics.revenue)}
          delta="Encaissé (commandes payées)"
          deltaColor="#1F7A52"
        />
        <MetricCard
          label="Commandes"
          value={String(d.metrics.orderCount)}
          delta="Hors paniers abandonnés"
        />
        <MetricCard
          label="Panier moyen"
          value={formatPrice(d.metrics.avgBasket)}
        />
        <MetricCard
          label="Clients"
          value={String(d.metrics.customerCount)}
          delta="Acheteuses (avec ou sans compte)"
        />
      </div>

      {/* Chiffre d'affaires — barres */}
      <Card className="px-[22px] py-5 mb-3.5">
        <div className="flex items-center justify-between">
          <SectionHeading>Chiffre d&apos;affaires</SectionHeading>
          <Mono
            className="text-[12px]"
            style={{ color: "rgba(20,21,26,0.45)" }}
          >
            12 dernières semaines
          </Mono>
        </div>
        <div className="flex items-end gap-[7px] h-24 mt-[22px]">
          {d.revenueSeries.map((b, i) => (
            <div
              key={i}
              className="flex-1"
              title={formatPrice(b.value)}
              style={{
                height: `${Math.max(3, b.pct)}%`,
                background: i === d.revenueSeries.length - 1 ? "#14151A" : "rgba(20,21,26,0.14)",
                borderRadius: "5px 5px 2px 2px",
              }}
            />
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-3.5 items-start">
        {/* Commandes récentes */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-[17px] pb-3.5">
            <SectionHeading>Commandes récentes</SectionHeading>
            <Link
              href="/admin/commandes"
              className="text-[12.5px] font-medium"
              style={{ color: "#1a5bff" }}
            >
              Tout voir
            </Link>
          </div>
          {d.recentOrders.length === 0 ? (
            <Empty>Aucune commande pour l&apos;instant.</Empty>
          ) : (
            d.recentOrders.map((o) => {
              const m = statusMeta(o.status);
              return (
                <Link
                  key={o.id}
                  href={`/admin/commandes/${o.id}`}
                  className="flex items-center justify-between gap-3.5 px-5 py-[13px] hover:bg-[rgba(20,21,26,0.02)] transition-colors"
                  style={{ borderTop: "1px solid rgba(20,21,26,0.06)" }}
                >
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-medium">{o.customer}</div>
                    <Mono
                      className="text-[11.5px] mt-[3px] block"
                      style={{ color: "rgba(20,21,26,0.42)" }}
                    >
                      {o.reference} · {o.date.toLocaleDateString("fr-FR")}
                    </Mono>
                  </div>
                  <div className="flex items-center gap-3.5 shrink-0">
                    <StatusPill label={m.label} bg={m.bg} fg={m.fg} />
                    <Mono className="text-[13px] font-medium w-[64px] text-right">
                      {formatPrice(o.total)}
                    </Mono>
                  </div>
                </Link>
              );
            })
          )}
        </Card>

        <div className="flex flex-col gap-3.5">
          {/* Produits populaires */}
          <Card className="px-5 pt-[17px] pb-2">
            <SectionHeading>Produits populaires</SectionHeading>
            {d.topProducts.length === 0 ? (
              <p
                className="text-[12.5px] py-4"
                style={{ color: "rgba(20,21,26,0.45)" }}
              >
                Les ventes apparaîtront ici.
              </p>
            ) : (
              d.topProducts.map((p) => (
                <div
                  key={p.slug}
                  className="flex items-center gap-3 py-[11px]"
                  style={{ borderTop: "1px solid rgba(20,21,26,0.06)" }}
                >
                  <Swatch seed={p.slug} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate">{p.name}</div>
                    <Mono
                      className="text-[11px] mt-0.5 block"
                      style={{ color: "rgba(20,21,26,0.42)" }}
                    >
                      {p.units} vendus
                    </Mono>
                  </div>
                  <Mono className="text-[12.5px] font-medium">
                    {formatPrice(p.revenue)}
                  </Mono>
                </div>
              ))
            )}
          </Card>

          {/* Clients récents */}
          <Card className="px-5 pt-[17px] pb-2">
            <SectionHeading>Clients récents</SectionHeading>
            {d.recentCustomers.length === 0 ? (
              <p
                className="text-[12.5px] py-4"
                style={{ color: "rgba(20,21,26,0.45)" }}
              >
                Aucun client inscrit.
              </p>
            ) : (
              d.recentCustomers.map((c) => (
                <Link
                  key={c.id}
                  href={`/admin/clients/${c.id}`}
                  className="flex items-center gap-3 py-[11px]"
                  style={{ borderTop: "1px solid rgba(20,21,26,0.06)" }}
                >
                  <span
                    className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0"
                    style={{
                      background: "rgba(20,21,26,0.06)",
                      color: "rgba(20,21,26,0.6)",
                    }}
                  >
                    {initials(c.name)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium">{c.name ?? c.email}</div>
                    <div
                      className="text-[11.5px] mt-0.5 truncate"
                      style={{ color: "rgba(20,21,26,0.42)" }}
                    >
                      {c.email}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="px-5 py-10 text-center text-[13px]"
      style={{
        color: "rgba(20,21,26,0.45)",
        borderTop: "1px solid rgba(20,21,26,0.06)",
      }}
    >
      {children}
    </div>
  );
}
