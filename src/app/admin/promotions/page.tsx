import { PageTitle, Card } from "@/components/admin/ui";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Promotions" };

interface PromoRow {
  code: string;
  kind: string;
  value: number;
  detail: string;
  minSubtotal: number;
  active: boolean;
  expiresAt: Date | null;
}

/**
 * Calcule la vue d'affichage des promos. Helper module (hors corps de
 * composant) : la fraîcheur per-request (Date.now) y est légitime côté serveur.
 */
function buildPromoViews(rows: PromoRow[]) {
  const now = Date.now();
  return rows.map((p) => {
    const expired = p.expiresAt ? p.expiresAt.getTime() < now : false;
    const live = p.active && !expired;
    return {
      code: p.code,
      value: p.kind === "percent" ? `−${p.value} %` : `−${formatPrice(p.value)}`,
      detail:
        p.detail +
        (p.minSubtotal > 0 ? ` · dès ${formatPrice(p.minSubtotal)}` : ""),
      status: live ? "Active" : expired ? "Expiré" : "Inactive",
      live,
    };
  });
}

export default async function AdminPromotionsPage() {
  const rows = await prisma.promotion.findMany({
    orderBy: { createdAt: "desc" },
  });
  const promotions = buildPromoViews(rows);
  return (
    <div>
      <PageTitle
        title="Promotions"
        subtitle="Codes promo de la boutique."
        action={
          <span
            className="text-[13px] font-medium px-4 py-2.5 rounded-[10px]"
            style={{ background: "#14151A", color: "#FBFAF8" }}
          >
            + Nouveau code
          </span>
        }
      />

      <div className="flex flex-col gap-3">
        {promotions.map((p) => (
          <Card
            key={p.code}
            className="px-[22px] py-[18px] flex items-center justify-between gap-[18px] flex-wrap"
          >
            <div className="flex items-center gap-4">
              <span
                className="text-[14px] font-medium tracking-[0.05em] px-3.5 py-2 rounded-lg"
                style={{
                  fontFamily: "var(--font-geist-mono), monospace",
                  background: "#FBFAF8",
                  border: "1px dashed rgba(20,21,26,0.2)",
                }}
              >
                {p.code}
              </span>
              <div>
                <div className="text-[14px] font-semibold">{p.value}</div>
                <div className="text-[12px] mt-0.5" style={{ color: "rgba(20,21,26,0.45)" }}>
                  {p.detail}
                </div>
              </div>
            </div>
            <span
              className="inline-flex items-center px-[11px] py-1 rounded-full text-[11.5px] font-medium"
              style={
                p.live
                  ? { background: "rgba(31,138,91,0.13)", color: "#1F7A52" }
                  : { background: "rgba(20,21,26,0.06)", color: "rgba(20,21,26,0.5)" }
              }
            >
              {p.status}
            </span>
          </Card>
        ))}
      </div>

      <p className="text-[12px] mt-6" style={{ color: "rgba(20,21,26,0.4)" }}>
        Démo — le moteur de codes promo n&apos;est pas encore branché sur le
        checkout. À activer côté Stripe / panier.
      </p>
    </div>
  );
}
