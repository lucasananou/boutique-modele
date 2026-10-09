"use client";

import { useRef, useEffect } from "react";
import { Card, Mono, SectionHeading } from "@/components/admin/ui";
import { formatPrice } from "@/lib/format";
import type { LiveEventRow } from "@/store/live";

const EVENT_META: Record<string, { label: string; color: string }> = {
  PAGE_VIEW: { label: "Page vue", color: "#9CA3AF" },
  PRODUCT_VIEW: { label: "Produit consulté", color: "#60A5FA" },
  ADD_TO_CART: { label: "Ajout panier", color: "#A78BFA" },
  REMOVE_FROM_CART: { label: "Retrait panier", color: "#FCD34D" },
  CART_UPDATE: { label: "Panier modifié", color: "#9CA3AF" },
  BEGIN_CHECKOUT: { label: "Checkout ouvert", color: "#FB923C" },
  PURCHASE: { label: "Commande ✓", color: "#34D399" },
};

export function LiveEventFeed({ events }: { events: LiveEventRow[] }) {
  const feedRef = useRef<HTMLDivElement>(null);
  const prevCount = useRef(events.length);

  // Scroll en haut quand de nouveaux événements arrivent
  useEffect(() => {
    if (events.length !== prevCount.current && feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
    prevCount.current = events.length;
  }, [events.length]);

  return (
    <Card
      style={{ display: "flex", flexDirection: "column", height: 500 }}
    >
      <div style={{ padding: "17px 20px 14px", flexShrink: 0 }}>
        <SectionHeading>Flux d&apos;événements</SectionHeading>
      </div>

      <div
        ref={feedRef}
        style={{ flex: 1, overflowY: "auto", paddingBottom: 8 }}
      >
        {events.length === 0 && (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              fontSize: 13,
              color: "rgba(20,21,26,0.38)",
            }}
          >
            En attente d&apos;activité…
          </div>
        )}
        {events.map((e) => {
          const meta = EVENT_META[e.eventType] ?? {
            label: e.eventType,
            color: "#9CA3AF",
          };
          const location = [e.session?.city, e.session?.country]
            .filter(Boolean)
            .join(", ");
          return (
            <div
              key={e.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "9px 20px",
                borderTop: "1px solid rgba(20,21,26,0.05)",
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: meta.color,
                  marginTop: 5,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>
                  {meta.label}
                </div>
                {e.productName && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "rgba(20,21,26,0.55)",
                      marginTop: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {e.productName}
                  </div>
                )}
                {e.orderRef && (
                  <Mono
                    style={{
                      fontSize: 11,
                      color: "#1F7A52",
                      display: "block",
                      marginTop: 1,
                    }}
                  >
                    {e.orderRef} · {formatPrice(e.orderValue ?? 0)}
                  </Mono>
                )}
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
              <Mono
                style={{
                  fontSize: 11,
                  color: "rgba(20,21,26,0.32)",
                  flexShrink: 0,
                  paddingTop: 2,
                }}
              >
                {new Date(e.createdAt).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </Mono>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
