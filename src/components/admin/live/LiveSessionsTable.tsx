import { Card, Mono, SectionHeading, StatusPill } from "@/components/admin/ui";
import { formatPrice } from "@/lib/format";
import type { LiveSession } from "@/store/live";

const STATUS_META: Record<
  string,
  { label: string; bg: string; fg: string }
> = {
  BROWSING: {
    label: "Navigation",
    bg: "rgba(20,21,26,0.06)",
    fg: "rgba(20,21,26,0.6)",
  },
  CART: { label: "Panier", bg: "#EDE9FE", fg: "#6D28D9" },
  CHECKOUT: { label: "Checkout", bg: "#FEF3C7", fg: "#92400E" },
  CONVERTED: { label: "Achat", bg: "#D1FAE5", fg: "#065F46" },
  INACTIVE: {
    label: "Inactif",
    bg: "rgba(20,21,26,0.04)",
    fg: "rgba(20,21,26,0.3)",
  },
};

export function LiveSessionsTable({ sessions }: { sessions: LiveSession[] }) {
  const active = sessions.filter((s) => s.status !== "INACTIVE");

  return (
    <Card>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "17px 20px 14px",
        }}
      >
        <SectionHeading>Sessions actives</SectionHeading>
        <Mono style={{ fontSize: 12, color: "rgba(20,21,26,0.4)" }}>
          {active.length} en ligne
        </Mono>
      </div>

      {active.length === 0 && (
        <div
          style={{
            padding: "28px 20px",
            textAlign: "center",
            fontSize: 13,
            color: "rgba(20,21,26,0.38)",
            borderTop: "1px solid rgba(20,21,26,0.06)",
          }}
        >
          Aucun visiteur actif.
        </div>
      )}

      {active.slice(0, 25).map((s) => {
        const m = STATUS_META[s.status] ?? STATUS_META.BROWSING;
        const location = [s.city, s.country].filter(Boolean).join(", ");
        return (
          <div
            key={s.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 20px",
              borderTop: "1px solid rgba(20,21,26,0.05)",
            }}
          >
            <StatusPill label={m.label} bg={m.bg} fg={m.fg} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  color: "rgba(20,21,26,0.7)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {s.currentPage ?? "—"}
              </div>
              {location && (
                <div
                  style={{
                    fontSize: 11,
                    color: "rgba(20,21,26,0.35)",
                    marginTop: 1,
                  }}
                >
                  {location}
                </div>
              )}
            </div>
            {s.cartValue > 0 && (
              <Mono style={{ fontSize: 13, fontWeight: 500, color: "#6D28D9" }}>
                {formatPrice(s.cartValue)}
              </Mono>
            )}
            <Mono style={{ fontSize: 11, color: "rgba(20,21,26,0.32)" }}>
              {new Date(s.lastSeenAt).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Mono>
          </div>
        );
      })}
    </Card>
  );
}
