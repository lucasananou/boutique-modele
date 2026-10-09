"use client";

import type { ReactNode } from "react";
import { Card, Mono, SectionHeading } from "@/components/admin/ui";
import { CountryFlag, SourceIcon, BrowserIcon, PageIcon, InitialChip } from "./icons";
import type { LiveAnalytics } from "@/lib/live/analytics";

type Row = { label: string; count: number };

function AnalyticsCard({
  title,
  dimension,
  rows,
  renderIcon,
}: {
  title: string;
  dimension: string;
  rows: Row[];
  renderIcon: (label: string) => ReactNode;
}) {
  const max = Math.max(...rows.map((r) => r.count), 1);

  return (
    <Card className="px-5 pt-[18px] pb-[18px]">
      <div className="mb-[15px] flex items-center justify-between">
        <SectionHeading>{title}</SectionHeading>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11.5,
            fontWeight: 500,
            color: "rgba(20,21,26,0.5)",
            background: "rgba(20,21,26,0.04)",
            border: "1px solid rgba(20,21,26,0.07)",
            borderRadius: 8,
            padding: "4px 9px",
          }}
        >
          {dimension}
          <span style={{ fontSize: 8, opacity: 0.6 }}>▾</span>
        </span>
      </div>

      {rows.length === 0 ? (
        <p style={{ fontSize: 12.5, color: "rgba(20,21,26,0.38)", padding: "10px 2px" }}>
          Pas encore de données.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map((row, i) => {
            const pct = Math.max((row.count / max) * 100, row.count > 0 ? 4 : 0);
            return (
              <div
                key={i}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  padding: "10px 13px",
                  borderRadius: 11,
                  background: "rgba(20,21,26,0.035)",
                  overflow: "hidden",
                }}
              >
                {/* Barre de remplissage proportionnelle */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${pct}%`,
                    background: "rgba(20,21,26,0.05)",
                    transition: "width 0.6s cubic-bezier(0.22,1,0.36,1)",
                    pointerEvents: "none",
                  }}
                />
                <span style={{ zIndex: 1, display: "flex" }}>{renderIcon(row.label)}</span>
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: 13.5,
                    fontWeight: 500,
                    color: "rgba(20,21,26,0.82)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    zIndex: 1,
                  }}
                >
                  {row.label}
                </span>
                <Mono
                  style={{
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: "rgba(20,21,26,0.75)",
                    zIndex: 1,
                    flexShrink: 0,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {row.count.toLocaleString("fr-FR")}
                </Mono>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

export function LiveAnalytics({ data }: { data: LiveAnalytics }) {
  const sources =
    data.topReferrers.length > 0 ? data.topReferrers : [{ label: "Direct", count: 0 }];

  return (
    <div
      className="grid gap-3.5"
      style={{ gridTemplateColumns: "repeat(2, 1fr)" }}
    >
      <AnalyticsCard
        title="Pages les plus vues"
        dimension="Pages vues"
        rows={data.topPages}
        renderIcon={() => <PageIcon />}
      />
      <AnalyticsCard
        title="Sources"
        dimension="Source"
        rows={sources}
        renderIcon={(label) => <SourceIcon name={label} />}
      />
      <AnalyticsCard
        title="Localisations"
        dimension="Pays"
        rows={data.topCountries}
        renderIcon={(label) => <CountryFlag name={label} />}
      />
      <AnalyticsCard
        title="Appareils"
        dimension="Navigateur"
        rows={data.topBrowsers}
        renderIcon={(label) => <BrowserIcon name={label} />}
      />
      <AnalyticsCard
        title="Produits vendus"
        dimension="Ventes"
        rows={data.topConversions}
        renderIcon={(label) => <InitialChip text={label} />}
      />
      <AnalyticsCard
        title="Produits consultés"
        dimension="Vues"
        rows={data.topProducts}
        renderIcon={(label) => <InitialChip text={label} />}
      />
    </div>
  );
}
