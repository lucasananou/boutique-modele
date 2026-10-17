import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma";
import { formatMoney } from "@/lib/currency";
import { Card, PageTitle, StatusPill, Mono, SectionHeading } from "@/components/admin/ui";
import { CopyButton, ForwardForm } from "@/components/admin/FulfillmentActions";
import { TrackingForm } from "@/components/admin/TrackingForm";
import { carrierLabel, trackingLink } from "@/lib/carriers";
import { US_STATES } from "@/lib/address";
import { store } from "@/stores";

export const metadata = { title: "Expéditions" };
export const dynamic = "force-dynamic";

const COUNTRY_NAMES: Record<string, string> = { US: "United States", FR: "France" };

type OrderRow = Awaited<ReturnType<typeof loadOrders>>[number];

function loadOrders(where: Prisma.OrderWhereInput, take = 100) {
  return prisma.order.findMany({
    where,
    include: { items: true },
    orderBy: { createdAt: "asc" },
    take,
  });
}

/** Champs d'adresse, dans l'ordre du formulaire de commande manuelle du fournisseur. */
function addressFields(o: OrderRow): [label: string, value: string][] {
  const [first, ...rest] = (o.shippingName ?? "").trim().split(/\s+/);
  const stateName = US_STATES.find(([c]) => c === o.shippingState)?.[1];
  return [
    ["Prénom (First name)", first ?? ""],
    ["Nom (Last name)", rest.join(" ")],
    ["Adresse 1", o.shippingLine1 ?? ""],
    ["Adresse 2", o.shippingLine2 ?? ""],
    ["Ville (City)", o.shippingCity ?? ""],
    ["État (State)", o.shippingState ? `${o.shippingState}${stateName ? ` — ${stateName}` : ""}` : ""],
    ["ZIP", o.shippingZip ?? ""],
    ["Pays", COUNTRY_NAMES[o.shippingCountry ?? ""] ?? o.shippingCountry ?? ""],
    ["Téléphone", o.shippingPhone ?? ""],
    ["E-mail", o.email],
  ];
}

function unitsLabel(n: number) {
  const u = store.fulfillment?.unitLabel ?? { one: "unité", many: "unités" };
  return `${n} ${n > 1 ? u.many : u.one}`;
}

function fullText(o: OrderRow): string {
  const lines = [
    o.shippingName,
    o.shippingLine1,
    o.shippingLine2,
    `${o.shippingCity ?? ""}, ${o.shippingState ?? ""} ${o.shippingZip ?? ""}`.trim(),
    COUNTRY_NAMES[o.shippingCountry ?? ""] ?? o.shippingCountry,
    o.shippingPhone,
    o.email,
    "",
    ...o.items.map((it) => `${it.name}${it.variantLabel ? ` — ${it.variantLabel}` : ""} × ${it.quantity} = ${unitsLabel(it.units * it.quantity)}`),
    `Total : ${unitsLabel(o.items.reduce((s, it) => s + it.units * it.quantity, 0))}`,
    `Réf. boutique : ${o.reference}`,
  ];
  return lines.filter((l) => l !== null && l !== undefined).join("\n");
}

const KIND_LABEL: Record<string, string> = {
  one_time: "Achat simple",
  subscription_start: "Abonnement (1re livraison)",
  subscription_renewal: "Renouvellement d'abonnement",
};

export default async function AdminFulfillmentPage() {
  const partner = store.fulfillment;
  if (!partner) notFound();

  const [toForward, awaitingTracking, shipped] = await Promise.all([
    loadOrders({ status: "PAID", forwardedAt: null }),
    loadOrders({ status: "PAID", forwardedAt: { not: null } }),
    prisma.order.findMany({
      where: { status: { in: ["SHIPPED", "DELIVERED"] } },
      include: { items: true },
      orderBy: { shippedAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <div>
      <PageTitle
        title="Expéditions"
        subtitle={`${toForward.length} à transmettre à ${partner.partner} · ${awaitingTracking.length} en attente du suivi`}
        action={
          <a
            href={partner.dashboardUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[13px] font-medium px-4 py-2.5 rounded-[11px]"
            style={{ background: "#14151A", color: "#FBFAF8" }}
          >
            Ouvrir {partner.partner} ↗
          </a>
        }
      />

      <Card className="px-[22px] py-4 mb-6">
        <p className="m-0 text-[13px] leading-[1.6]" style={{ color: "rgba(20,21,26,0.65)" }}>
          {partner.note}
        </p>
      </Card>

      <Section title={`1. À transmettre à ${partner.partner}`} empty="Aucune commande payée en attente.">
        {toForward.map((o) => (
          <OrderBlock key={o.id} o={o}>
            <ForwardForm orderId={o.id} forwarded={false} partner={partner.partner} />
          </OrderBlock>
        ))}
      </Section>

      <Section title="2. Transmises — saisir le suivi (envoie l'e-mail d'expédition)" empty="Aucune commande en attente de suivi.">
        {awaitingTracking.map((o) => (
          <OrderBlock key={o.id} o={o}>
            <div className="text-[12px] mb-3" style={{ color: "rgba(20,21,26,0.55)" }}>
              Transmise le {o.forwardedAt?.toLocaleDateString("fr-FR")}
              {o.fulfillmentRef ? (
                <>
                  {" "}· réf. {partner.partner} <Mono>{o.fulfillmentRef}</Mono>
                </>
              ) : null}
            </div>
            <TrackingForm
              orderId={o.id}
              status={o.status}
              initial={{
                carrier: o.trackingCarrier ?? (o.shippingCountry === "US" ? "usps" : null),
                number: o.trackingNumber,
                url: o.trackingUrl,
              }}
            />
            <div className="mt-2">
              <ForwardForm orderId={o.id} forwarded partner={partner.partner} />
            </div>
          </OrderBlock>
        ))}
      </Section>

      <Section title="3. Expédiées récemment" empty="Aucune expédition pour l'instant.">
        {shipped.map((o) => {
          const link = trackingLink(o.trackingCarrier, o.trackingNumber, o.trackingUrl);
          return (
            <Card key={o.id} className="px-[22px] py-3.5 flex items-center gap-4 flex-wrap">
              <Link href={`/admin/commandes/${o.id}`} className="text-[13.5px] font-medium">
                {o.reference}
              </Link>
              <span className="text-[12.5px]" style={{ color: "rgba(20,21,26,0.55)" }}>
                {o.shippingName} · {o.shippingCity}, {o.shippingState}
              </span>
              <span className="text-[12.5px] ml-auto" style={{ color: "rgba(20,21,26,0.6)" }}>
                {carrierLabel(o.trackingCarrier)} <Mono>{o.trackingNumber}</Mono>
                {link && (
                  <>
                    {" · "}
                    <a href={link} target="_blank" rel="noreferrer" style={{ color: "#1a5bff" }}>
                      suivre
                    </a>
                  </>
                )}
              </span>
            </Card>
          );
        })}
      </Section>
    </div>
  );
}

function Section({ title, empty, children }: { title: string; empty: string; children: React.ReactNode[] }) {
  return (
    <section className="mb-9">
      <div className="mb-3">
        <SectionHeading>{title}</SectionHeading>
      </div>
      <div className="flex flex-col gap-3.5">
        {children.length ? (
          children
        ) : (
          <Card className="px-[22px] py-5 text-[13px]" style={{ color: "rgba(20,21,26,0.5)" }}>
            {empty}
          </Card>
        )}
      </div>
    </section>
  );
}

function OrderBlock({ o, children }: { o: OrderRow; children: React.ReactNode }) {
  const totalUnits = o.items.reduce((s, it) => s + it.units * it.quantity, 0);
  return (
    <Card className="overflow-hidden" style={{ display: "block" }}>
      <div
        className="px-[22px] py-3.5 flex items-center gap-3 flex-wrap"
        style={{ borderBottom: "1px solid rgba(20,21,26,0.06)" }}
      >
        <Link href={`/admin/commandes/${o.id}`} className="text-[15px] font-semibold">
          {o.reference}
        </Link>
        <StatusPill
          label={KIND_LABEL[o.kind] ?? o.kind}
          bg={o.kind === "one_time" ? "rgba(20,21,26,0.06)" : "rgba(26,91,255,0.10)"}
          fg={o.kind === "one_time" ? "rgba(20,21,26,0.6)" : "#1a5bff"}
        />
        <span className="text-[12.5px]" style={{ color: "rgba(20,21,26,0.5)" }}>
          Payée le {o.createdAt.toLocaleDateString("fr-FR")} · {formatMoney(o.amountTotal, o.currency, "en")}
        </span>
        <span className="ml-auto">
          <CopyButton text={fullText(o)} label="Tout copier" />
        </span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_280px]">
        <div className="px-[22px] py-4" style={{ borderRight: "1px solid rgba(20,21,26,0.06)" }}>
          <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: "rgba(20,21,26,0.45)" }}>
            Destinataire
          </div>
          <table className="w-full text-[13px]">
            <tbody>
              {addressFields(o).map(([label, value]) => (
                <tr key={label}>
                  <td className="py-[3px] pr-3 whitespace-nowrap" style={{ color: "rgba(20,21,26,0.45)" }}>
                    {label}
                  </td>
                  <td className="py-[3px] font-medium break-all">{value || <span style={{ color: "rgba(20,21,26,0.3)" }}>—</span>}</td>
                  <td className="py-[3px] text-right">{value ? <CopyButton text={value.split(" — ")[0]} /> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-[22px] py-4" style={{ borderRight: "1px solid rgba(20,21,26,0.06)" }}>
          <div className="text-[11px] uppercase tracking-[0.08em] mb-2" style={{ color: "rgba(20,21,26,0.45)" }}>
            À commander
          </div>
          {o.items.map((it) => (
            <div key={it.id} className="flex items-start justify-between gap-3 py-1.5 text-[13px]">
              <div>
                <div className="font-medium">{it.name}</div>
                <div style={{ color: "rgba(20,21,26,0.55)" }}>
                  {it.variantLabel ?? "—"} × {it.quantity}
                  {it.intervalDays ? ` · abonnement ${it.intervalDays} j` : ""}
                </div>
              </div>
              <Mono className="text-[13px] font-semibold whitespace-nowrap">{unitsLabel(it.units * it.quantity)}</Mono>
            </div>
          ))}
          <div
            className="flex justify-between items-center mt-2 pt-2.5 text-[14px] font-semibold"
            style={{ borderTop: "1px solid rgba(20,21,26,0.06)" }}
          >
            <span>Total à expédier</span>
            <span className="flex items-center gap-2">
              <Mono>{unitsLabel(totalUnits)}</Mono>
              <CopyButton text={String(totalUnits)} />
            </span>
          </div>
        </div>
        <div className="px-[22px] py-4">{children}</div>
      </div>
    </Card>
  );
}
