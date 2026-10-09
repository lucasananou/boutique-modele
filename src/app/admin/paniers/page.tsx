import { requireAdmin } from "@/lib/admin";
import { getAbandonedCarts, type AbandonedState } from "@/lib/adminData";
import { formatPrice } from "@/lib/format";
import {
  Card,
  PageTitle,
  MetricCard,
  StatusPill,
  Mono,
} from "@/components/admin/ui";
import { RelanceButton } from "@/components/admin/RelanceButton";

export const metadata = { title: "Paniers" };
export const dynamic = "force-dynamic";

const stateMeta: Record<
  AbandonedState,
  { label: string; bg: string; fg: string }
> = {
  abandoned: {
    label: "Abandonné",
    bg: "rgba(176,118,20,0.12)",
    fg: "#9A6608",
  },
  reminded: { label: "Relancé", bg: "rgba(26,91,255,0.10)", fg: "#1a5bff" },
  recovered: {
    label: "Récupéré",
    bg: "rgba(31,138,91,0.13)",
    fg: "#1F7A52",
  },
};

export default async function AdminAbandonedCartsPage() {
  await requireAdmin();
  const { rows, metrics } = await getAbandonedCarts();

  return (
    <div>
      <PageTitle
        title="Paniers abandonnés"
        subtitle="Commandes non finalisées des 14 derniers jours (après 1 h de grâce)."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MetricCard
          label="Paniers abandonnés"
          value={String(metrics.abandonedCount)}
        />
        <MetricCard
          label="Valeur abandonnée"
          value={formatPrice(metrics.abandonedValue)}
        />
        <MetricCard
          label="Taux de récupération"
          value={`${metrics.recoveryRate} %`}
          delta={`${metrics.recoveredCount} récupéré${metrics.recoveredCount > 1 ? "s" : ""}`}
          deltaColor="#1F7A52"
        />
        <MetricCard label="Paniers relancés" value={String(metrics.remindedCount)} />
      </div>

      <Card className="overflow-hidden">
        <div
          className="grid grid-cols-[1fr_100px_70px_110px_90px_120px] gap-3.5 px-5 py-3 text-[10.5px] tracking-[0.1em] uppercase"
          style={{
            fontFamily: "var(--font-geist-mono), monospace",
            color: "rgb(var(--ad-ink-rgb) / 0.4)",
            borderBottom: "1px solid var(--ad-border)",
          }}
        >
          <span>Client</span>
          <span className="text-right">Valeur</span>
          <span className="text-center">Articles</span>
          <span>Date</span>
          <span className="text-center">Relances</span>
          <span>Statut</span>
        </div>

        {rows.length === 0 ? (
          <div
            className="px-5 py-16 text-center text-[13.5px]"
            style={{ color: "rgb(var(--ad-ink-rgb) / 0.5)" }}
          >
            Aucun panier abandonné sur la période.
          </div>
        ) : (
          rows.map((r) => {
            const m = stateMeta[r.state];
            return (
              <div
                key={r.id}
                className="grid grid-cols-[1fr_100px_70px_110px_90px_120px] gap-3.5 items-center px-5 py-3.5"
                style={{ borderTop: "1px solid var(--ad-border)" }}
              >
                <div className="min-w-0">
                  <div className="text-[13.5px] font-medium truncate">
                    {r.email}
                  </div>
                  <Mono
                    className="text-[11px]"
                    style={{ color: "rgb(var(--ad-ink-rgb) / 0.42)" }}
                  >
                    {r.reference}
                  </Mono>
                </div>
                <Mono className="text-[13px] font-medium text-right">
                  {formatPrice(r.value)}
                </Mono>
                <span
                  className="text-[13px] text-center"
                  style={{ color: "rgb(var(--ad-ink-rgb) / 0.7)" }}
                >
                  {r.itemsCount}
                </span>
                <span
                  className="text-[13px]"
                  style={{ color: "rgb(var(--ad-ink-rgb) / 0.55)" }}
                >
                  {r.date.toLocaleDateString("fr-FR")}
                </span>
                <span className="text-[12.5px] text-center">
                  <Mono>{r.reminders}</Mono>
                  <span style={{ color: "rgb(var(--ad-ink-rgb) / 0.35)" }}>
                    /3
                  </span>
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusPill label={m.label} bg={m.bg} fg={m.fg} />
                  {r.state !== "recovered" && (
                    <RelanceButton
                      orderId={r.id}
                      disabled={r.reminders >= 3}
                    />
                  )}
                </div>
              </div>
            );
          })
        )}
      </Card>

      <p className="text-[12px] mt-6" style={{ color: "rgb(var(--ad-ink-rgb) / 0.4)" }}>
        Les relances automatiques (1 h · 24 h · 72 h) sont envoyées par le cron
        <Mono className="mx-1">/api/carts/relance</Mono>. « Relancer » envoie
        immédiatement la prochaine relance due.
      </p>
    </div>
  );
}
