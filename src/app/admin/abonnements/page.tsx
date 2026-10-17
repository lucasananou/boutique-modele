import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/currency";
import { Card, PageTitle, StatusPill, Mono } from "@/components/admin/ui";
import { store } from "@/stores";

export const metadata = { title: "Abonnements" };
export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  active: { label: "Actif", bg: "rgba(31,138,91,0.13)", fg: "#1F7A52" },
  past_due: { label: "Paiement en échec", bg: "rgba(196,48,72,0.11)", fg: "#A3243B" },
  paused: { label: "En pause", bg: "rgba(176,118,20,0.12)", fg: "#9A6608" },
  canceled: { label: "Résilié", bg: "rgba(20,21,26,0.06)", fg: "rgba(20,21,26,0.55)" },
  incomplete: { label: "Incomplet", bg: "rgba(176,118,20,0.12)", fg: "#9A6608" },
};

export default async function AdminSubscriptionsPage() {
  if (!store.subscriptions) notFound();
  const subs = await prisma.subscription.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { _count: { select: { orders: true } } },
  });
  const active = subs.filter((s) => s.status === "active" && !s.cancelAtPeriodEnd);
  const mrr = active.reduce((sum, s) => sum + Math.round((s.unitAmount * 30) / s.intervalDays), 0);

  return (
    <div>
      <PageTitle
        title="Abonnements"
        subtitle={`${active.length} actif${active.length > 1 ? "s" : ""} · revenu mensuel récurrent estimé ${formatMoney(mrr, store.catalogCurrency ?? "EUR", "en")}`}
      />
      <Card className="overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr style={{ color: "rgba(20,21,26,0.45)", textAlign: "left" }}>
              {["Client", "Formule", "Fréquence", "Montant", "Prochaine livraison", "Commandes", "Statut"].map((h) => (
                <th key={h} className="px-[18px] py-3 font-medium text-[12px]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subs.length === 0 && (
              <tr>
                <td colSpan={7} className="px-[18px] py-6" style={{ color: "rgba(20,21,26,0.5)" }}>
                  Aucun abonnement pour l&apos;instant.
                </td>
              </tr>
            )}
            {subs.map((s) => {
              const m = STATUS[s.status] ?? STATUS.incomplete;
              return (
                <tr key={s.id} style={{ borderTop: "1px solid rgba(20,21,26,0.06)" }}>
                  <td className="px-[18px] py-3">
                    <div className="font-medium">{s.shippingName ?? s.email}</div>
                    <div style={{ color: "rgba(20,21,26,0.5)" }}>{s.email}</div>
                  </td>
                  <td className="px-[18px] py-3">
                    {s.name}
                    {s.variantLabel ? ` — ${s.variantLabel}` : ""} × {s.quantity}
                  </td>
                  <td className="px-[18px] py-3">{s.intervalDays} jours</td>
                  <td className="px-[18px] py-3">
                    <Mono>{formatMoney(s.unitAmount, s.currency, "en")}</Mono>
                  </td>
                  <td className="px-[18px] py-3">
                    {s.cancelAtPeriodEnd
                      ? `Résiliation le ${s.nextChargeAt?.toLocaleDateString("fr-FR") ?? "—"}`
                      : s.nextChargeAt?.toLocaleDateString("fr-FR") ?? "—"}
                  </td>
                  <td className="px-[18px] py-3">{s._count.orders}</td>
                  <td className="px-[18px] py-3">
                    <StatusPill label={m.label} bg={m.bg} fg={m.fg} />
                    {!s.stripeSubscriptionId && (
                      <div className="text-[11px] mt-1" style={{ color: "rgba(20,21,26,0.45)" }}>
                        mode démo (sans Stripe)
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
