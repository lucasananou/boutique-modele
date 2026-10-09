import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderDetail, initials } from "@/lib/adminData";
import { formatPrice } from "@/lib/format";
import { statusMeta } from "@/lib/adminStatus";
import { Card, StatusPill, Mono, SectionHeading } from "@/components/admin/ui";
import { StatusUpdater } from "@/components/admin/StatusUpdater";
import { OrderItemThumb } from "@/components/admin/OrderItemThumb";
import { TrackingForm } from "@/components/admin/TrackingForm";
import { carrierLabel, trackingLink } from "@/lib/carriers";

export const metadata = { title: "Commande" };

const timelineSteps = [
  { key: "PENDING", label: "Commande reçue" },
  { key: "PAID", label: "Paiement confirmé" },
  { key: "SHIPPED", label: "Expédiée" },
  { key: "DELIVERED", label: "Livrée" },
];
const order_rank: Record<string, number> = {
  PENDING: 0,
  PAID: 1,
  SHIPPED: 2,
  DELIVERED: 3,
  CANCELLED: -1,
  REFUNDED: -1,
};

export default async function AdminOrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const o = await getOrderDetail(id);
  if (!o) notFound();

  const m = statusMeta(o.status);
  const rank = order_rank[o.status] ?? 0;

  return (
    <div>
      <Link
        href="/admin/commandes"
        className="flex items-center gap-1.5 text-[13px] font-medium mb-[22px]"
        style={{ color: "rgba(20,21,26,0.55)" }}
      >
        ‹ Commandes
      </Link>

      <div className="flex items-center gap-3.5 mb-[30px] flex-wrap">
        <h1 className="m-0 text-[27px] font-semibold tracking-[-0.03em]">
          Commande {o.reference}
        </h1>
        <StatusPill label={m.label} bg={m.bg} fg={m.fg} />
        <span
          className="text-[13.5px] ml-auto"
          style={{ color: "rgba(20,21,26,0.5)" }}
        >
          {o.createdAt.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-3.5 items-start">
        <div className="flex flex-col gap-3.5">
          {/* Articles */}
          <Card className="overflow-hidden">
            <div className="px-[22px] pt-[17px] pb-3.5">
              <SectionHeading>Articles</SectionHeading>
            </div>
            {o.items.map((it) => (
              <div
                key={it.id}
                className="flex items-center gap-3.5 px-[22px] py-[13px]"
                style={{ borderTop: "1px solid rgba(20,21,26,0.06)" }}
              >
                <OrderItemThumb src={it.image} seed={it.slug} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-medium">{it.name}</div>
                  <div
                    className="text-[12px] mt-0.5"
                    style={{ color: "rgba(20,21,26,0.45)" }}
                  >
                    {it.variantLabel ?? "Taille unique"}
                  </div>
                </div>
                <Mono className="text-[12.5px]" style={{ color: "rgba(20,21,26,0.5)" }}>
                  ×{it.quantity}
                </Mono>
                <Mono className="text-[13px] font-medium w-[70px] text-right">
                  {formatPrice(it.unitPrice * it.quantity)}
                </Mono>
              </div>
            ))}
            <div
              className="px-[22px] py-4 flex flex-col gap-[9px]"
              style={{ borderTop: "1px solid rgba(20,21,26,0.06)" }}
            >
              <Line label="Sous-total" value={formatPrice(o.subtotal)} />
              {o.discountAmount > 0 && (
                <Line
                  label={`Remise${o.discountCode ? ` (${o.discountCode})` : ""}`}
                  value={`−${formatPrice(o.discountAmount)}`}
                />
              )}
              <Line
                label="Livraison"
                value={o.shipping > 0 ? formatPrice(o.shipping) : "Offerte"}
              />
              <div
                className="flex justify-between text-[15px] font-semibold pt-[9px]"
                style={{ borderTop: "1px solid rgba(20,21,26,0.06)" }}
              >
                <span>Total</span>
                <Mono>{formatPrice(o.amountTotal)}</Mono>
              </div>
              {o.refundedAmount > 0 && (
                <Line label="Remboursé" value={`−${formatPrice(o.refundedAmount)}`} />
              )}
              {o.giftWrap && (
                <div className="text-[11.5px]" style={{ color: "#1a5bff" }}>
                  Emballage cadeau inclus
                </div>
              )}
            </div>
          </Card>

          {/* Suivi */}
          <Card className="px-[22px] py-5">
            <SectionHeading>Suivi</SectionHeading>
            <div className="mt-4">
              {o.status === "CANCELLED" || o.status === "REFUNDED" ? (
                <div className="text-[13px]" style={{ color: statusMeta(o.status).fg }}>
                  {o.status === "REFUNDED"
                    ? "Commande remboursée."
                    : "Commande annulée."}
                </div>
              ) : (
                timelineSteps.map((step, i) => {
                  const done = i <= rank;
                  const isLast = i === timelineSteps.length - 1;
                  return (
                    <div key={step.key} className="flex gap-3.5">
                      <div className="flex flex-col items-center">
                        <span
                          className="w-[11px] h-[11px] rounded-full shrink-0"
                          style={{
                            background: done ? "#14151A" : "#fff",
                            border: `2px solid ${done ? "#14151A" : "rgba(20,21,26,0.2)"}`,
                          }}
                        />
                        {!isLast && (
                          <span
                            className="w-0.5 flex-1 min-h-[18px]"
                            style={{
                              background: i < rank ? "#14151A" : "rgba(20,21,26,0.12)",
                            }}
                          />
                        )}
                      </div>
                      <div className="pb-3.5">
                        <div
                          className="text-[13px] font-medium"
                          style={{ color: done ? "#14151A" : "rgba(20,21,26,0.4)" }}
                        >
                          {step.label}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Colonne droite */}
        <div className="flex flex-col gap-3.5">
          <Card className="px-[22px] py-5">
            <div className="mb-3.5">
              <SectionHeading>Mettre à jour</SectionHeading>
            </div>
            <StatusUpdater orderId={o.id} current={o.status} />
          </Card>

          <Card className="px-[22px] py-5">
            <div className="mb-3.5">
              <SectionHeading>Expédition</SectionHeading>
            </div>
            {o.trackingNumber && (
              <div className="text-[12.5px] mb-3.5" style={{ color: "rgba(20,21,26,0.6)" }}>
                {carrierLabel(o.trackingCarrier)} · <Mono>{o.trackingNumber}</Mono>
                {trackingLink(o.trackingCarrier, o.trackingNumber, o.trackingUrl) && (
                  <>
                    {" · "}
                    <a
                      href={trackingLink(o.trackingCarrier, o.trackingNumber, o.trackingUrl)!}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "#1a5bff" }}
                    >
                      suivre
                    </a>
                  </>
                )}
                {o.shippedAt && (
                  <div className="text-[11.5px] mt-1">
                    Expédiée le {o.shippedAt.toLocaleDateString("fr-FR")}
                  </div>
                )}
              </div>
            )}
            <TrackingForm
              orderId={o.id}
              status={o.status}
              initial={{ carrier: o.trackingCarrier, number: o.trackingNumber, url: o.trackingUrl }}
            />
          </Card>

          <Card className="px-[22px] py-5">
            <div className="mb-3.5">
              <SectionHeading>Client</SectionHeading>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <span
                className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-[12px] font-semibold"
                style={{ background: "rgba(20,21,26,0.06)", color: "rgba(20,21,26,0.6)" }}
              >
                {initials(o.customerName)}
              </span>
              <div className="min-w-0">
                <div className="text-[13.5px] font-medium">{o.customerName}</div>
                <Link
                  href={o.customerHref}
                  className="text-[11.5px]"
                  style={{ color: "#1a5bff" }}
                >
                  Voir la fiche
                </Link>
              </div>
            </div>
            <div
              className="text-[12px] leading-[1.7] pt-3.5"
              style={{
                color: "rgba(20,21,26,0.5)",
                borderTop: "1px solid rgba(20,21,26,0.06)",
              }}
            >
              <div>{o.email}</div>
              {o.shippingName && (
                <div className="mt-1">
                  {o.shippingName}
                  <br />
                  {o.shippingLine1}
                  <br />
                  {o.shippingZip} {o.shippingCity} {o.shippingCountry}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-[13px]" style={{ color: "rgba(20,21,26,0.6)" }}>
      <span>{label}</span>
      <Mono>{value}</Mono>
    </div>
  );
}
