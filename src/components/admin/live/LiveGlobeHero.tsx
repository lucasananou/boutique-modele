"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { LiveMap } from "./LiveMap";
import { Mono } from "@/components/admin/ui";
import { formatPrice } from "@/lib/format";
import type { LiveSession, LiveStats } from "@/store/live";

const VISITOR_COLOR = "#14b8a6";
const ORDER_COLOR = "#4f46e5";

interface Props {
  sessions: LiveSession[];
  stats: LiveStats;
  connected: boolean;
  demo?: boolean;
  /** Défini => mode période (données historiques) ; sinon mode live. */
  periodLabel?: string;
}

/* ---------- Animation de compteur ---------- */
function useCountUp(value: number) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    const from = fromRef.current;
    fromRef.current = value;
    if (from === value) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    const dur = 500;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // Filet de sécurité : garantit la valeur finale même si rAF est throttlé
    // (onglet en arrière-plan, aperçu headless…).
    const safety = setTimeout(() => setDisplay(value), dur + 120);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(safety);
    };
  }, [value]);

  return display;
}

/* ---------- Carte overlay générique ---------- */
function GlassCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.94)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(20,21,26,0.06)",
        borderRadius: 14,
        boxShadow: "0 10px 34px rgba(20,21,26,0.12)",
        padding: "15px 17px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function TileLabel({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-geist-mono), monospace",
        fontSize: 10,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "rgba(20,21,26,0.42)",
      }}
    >
      {children}
    </div>
  );
}

/* ---------- Tuile chiffre ---------- */
function StatTile({
  label,
  value,
  color,
  badge,
}: {
  label: string;
  value: string;
  color?: string;
  badge?: ReactNode;
}) {
  return (
    <GlassCard style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <TileLabel>{label}</TileLabel>
        {badge}
      </div>
      <div
        style={{
          marginTop: 8,
          fontSize: 27,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          fontVariantNumeric: "tabular-nums",
          color: color ?? "#14151a",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </GlassCard>
  );
}

/* ---------- Tuile « pages vues » (mini bar chart) ---------- */
function PageViewsTile({ series, badgeLabel }: { series: number[]; badgeLabel: string }) {
  const data = series.length ? series : new Array(10).fill(0);
  const max = Math.max(1, ...data);
  const total = data.reduce((a, b) => a + b, 0);

  return (
    <GlassCard style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <TileLabel>Pages vues</TileLabel>
        <span
          style={{
            fontSize: 10,
            color: "rgba(20,21,26,0.4)",
            background: "rgba(20,21,26,0.05)",
            padding: "2px 7px",
            borderRadius: 20,
          }}
        >
          {badgeLabel}
        </span>
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          marginTop: 6,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {total}
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "flex-end",
          gap: 3,
          marginTop: 8,
          minHeight: 46,
        }}
      >
        {data.map((v, i) => {
          const isLast = i === data.length - 1;
          return (
            <div
              key={i}
              title={`${v} vue${v > 1 ? "s" : ""}`}
              style={{
                flex: 1,
                height: `${Math.max(6, (v / max) * 100)}%`,
                minHeight: 4,
                borderRadius: 3,
                background: isLast
                  ? VISITOR_COLOR
                  : v > 0
                    ? "rgba(20,21,26,0.22)"
                    : "rgba(20,21,26,0.08)",
                transition: "height 0.5s cubic-bezier(0.22,1,0.36,1)",
              }}
            />
          );
        })}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 6,
          fontSize: 9.5,
          color: "rgba(20,21,26,0.32)",
        }}
      >
        <span>il y a 10 min</span>
        <span>maintenant</span>
      </div>
    </GlassCard>
  );
}

/* ---------- Tuile « comportement client » (entonnoir 3 cercles) ---------- */
function BehaviorTile({ stats, badgeLabel }: { stats: LiveStats; badgeLabel: string }) {
  const steps = [
    { label: "Paniers", value: stats.carts, color: "#8b5cf6" },
    { label: "Paiement", value: stats.checkouts, color: "#f97316" },
    { label: "Achats", value: stats.recentPurchaseCount, color: VISITOR_COLOR },
  ];
  const max = Math.max(1, ...steps.map((s) => s.value));

  return (
    <GlassCard style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <TileLabel>Comportement client</TileLabel>
        <span
          style={{
            fontSize: 10,
            color: "rgba(20,21,26,0.4)",
            background: "rgba(20,21,26,0.05)",
            padding: "2px 7px",
            borderRadius: 20,
          }}
        >
          {badgeLabel}
        </span>
      </div>

      <div
        style={{
          position: "relative",
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 10,
          minHeight: 56,
        }}
      >
        {/* Ligne de liaison */}
        <div
          style={{
            position: "absolute",
            left: "16%",
            right: "16%",
            top: 26,
            height: 2,
            background: "rgba(20,21,26,0.1)",
            zIndex: 0,
          }}
        />
        {steps.map((s, i) => {
          const size = 26 + (s.value / max) * 24;
          const active = s.value > 0;
          const isLast = i === steps.length - 1;
          return (
            <div
              key={s.label}
              style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                flex: 1,
              }}
            >
              <div
                style={{
                  width: size,
                  height: size,
                  borderRadius: "50%",
                  background: isLast && active ? s.color : "rgba(255,255,255,0.95)",
                  border: `2px solid ${active ? s.color : "rgba(20,21,26,0.14)"}`,
                  boxShadow: active ? `0 0 0 4px ${s.color}22` : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.5s cubic-bezier(0.22,1,0.36,1)",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: isLast && active ? "#fff" : active ? s.color : "rgba(20,21,26,0.2)",
                  }}
                />
              </div>
              <div
                style={{
                  marginTop: 7,
                  fontSize: 17,
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                  color: active ? "#14151a" : "rgba(20,21,26,0.3)",
                  lineHeight: 1,
                }}
              >
                {s.value}
              </div>
              <div style={{ fontSize: 10, color: "rgba(20,21,26,0.45)", marginTop: 2 }}>
                {s.label}
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

/* ---------- Légende ---------- */
function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span
        style={{
          width: 9,
          height: 9,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 0 3px ${color}22`,
        }}
      />
      <span style={{ fontSize: 12, color: "rgba(20,21,26,0.6)" }}>{label}</span>
    </div>
  );
}

/* ================= HERO ================= */
export function LiveGlobeHero({ sessions, stats, connected, demo = false, periodLabel }: Props) {
  const [fullscreen, setFullscreen] = useState(false);
  const dateLabel = new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const isLive = !periodLabel;

  const visitors = useCountUp(stats.visitors);
  const sessionsCount = useCountUp(stats.sessionsToday);
  const ordersToday = useCountUp(stats.ordersToday);
  const convRateStr =
    stats.visitors > 0
      ? `${((stats.recentPurchaseCount / stats.visitors) * 100).toFixed(1).replace(".", ",")} %`
      : "—";

  // Échap pour sortir du plein écran
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFullscreen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  return (
    <div
      style={{
        position: fullscreen ? "fixed" : "relative",
        inset: fullscreen ? 0 : undefined,
        zIndex: fullscreen ? 60 : undefined,
        height: fullscreen ? "100vh" : 660,
        borderRadius: fullscreen ? 0 : 18,
        overflow: "hidden",
        border: "1px solid rgba(20,21,26,0.08)",
        background:
          "radial-gradient(120% 120% at 50% 0%, #ffffff 0%, #f2f3f7 55%, #e9eaf1 100%)",
      }}
    >
      {/* Globe */}
      <div style={{ position: "absolute", inset: 0 }}>
        <LiveMap sessions={sessions} />
      </div>

      {/* En-tête haut-gauche */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 22,
          zIndex: 2,
          pointerEvents: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 600, letterSpacing: "-0.02em" }}>
            Live view
          </h2>
          {dateLabel && (
            <Mono style={{ fontSize: 12, color: "rgba(20,21,26,0.45)" }}>
              {dateLabel}
            </Mono>
          )}
          {demo && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: "#b45309",
                background: "rgba(245,158,11,0.16)",
                border: "1px solid rgba(245,158,11,0.35)",
                padding: "2px 8px",
                borderRadius: 20,
                pointerEvents: "auto",
              }}
            >
              DONNÉES DÉMO
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
          <LegendDot color={VISITOR_COLOR} label="Visiteur" />
          <LegendDot color={ORDER_COLOR} label="Commande" />
        </div>
      </div>

      {/* Haut-droite : statut + plein écran */}
      <div
        style={{
          position: "absolute",
          top: 20,
          right: 22,
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(8px)",
            padding: "5px 11px",
            borderRadius: 20,
            border: "1px solid rgba(20,21,26,0.06)",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: !isLive ? "#6366f1" : connected ? "#22c55e" : "#f87171",
              boxShadow: isLive && connected ? "0 0 0 3px rgba(34,197,94,0.25)" : undefined,
              animation: isLive && connected ? "livePulse 2s ease-in-out infinite" : undefined,
            }}
          />
          <span style={{ fontSize: 12, color: "rgba(20,21,26,0.6)", fontWeight: 500 }}>
            {!isLive ? periodLabel : connected ? "En direct" : "Connexion…"}
          </span>
        </div>

        <a
          href={demo ? "/admin/live" : "/admin/live?demo=1"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: demo ? "rgba(245,158,11,0.16)" : "rgba(255,255,255,0.85)",
            backdropFilter: "blur(8px)",
            border: `1px solid ${demo ? "rgba(245,158,11,0.4)" : "rgba(20,21,26,0.08)"}`,
            borderRadius: 20,
            padding: "5px 12px",
            fontSize: 12,
            fontWeight: 500,
            color: demo ? "#b45309" : "rgba(20,21,26,0.65)",
            textDecoration: "none",
            fontFamily: "inherit",
          }}
          title={demo ? "Revenir aux données réelles" : "Afficher des données de démonstration"}
        >
          {demo ? "● Démo active" : "○ Démo"}
        </a>

        <button
          onClick={() => setFullscreen((v) => !v)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(20,21,26,0.08)",
            borderRadius: 20,
            padding: "5px 12px",
            fontSize: 12,
            fontWeight: 500,
            color: "rgba(20,21,26,0.65)",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {fullscreen ? "✕ Réduire" : "⛶ Plein écran"}
        </button>
      </div>

      {/* Cartes bas */}
      <div
        style={{
          position: "absolute",
          left: 18,
          right: 18,
          bottom: 18,
          zIndex: 2,
          display: "grid",
          gridTemplateColumns: "minmax(150px,1fr) minmax(150px,1fr) minmax(190px,1.4fr) minmax(210px,1.5fr)",
          gap: 12,
          alignItems: "stretch",
        }}
      >
        {/* Col 1 : Visiteurs + Ventes */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <StatTile
            label={isLive ? "Visiteurs maintenant" : "Visiteurs"}
            value={String(visitors)}
            color={VISITOR_COLOR}
            badge={
              isLive ? (
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: VISITOR_COLOR,
                    animation: "livePulse 2s ease-in-out infinite",
                  }}
                />
              ) : undefined
            }
          />
          <StatTile
            label={isLive ? "Ventes du jour" : "Ventes"}
            value={formatPrice(stats.salesTodayValue)}
          />
        </div>

        {/* Col 2 : Sessions/Pages + Commandes */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <StatTile
            label={isLive ? "Sessions du jour" : "Taux de conversion"}
            value={isLive ? String(sessionsCount) : convRateStr}
          />
          <StatTile
            label={isLive ? "Commandes du jour" : "Commandes"}
            value={String(ordersToday)}
            color={ORDER_COLOR}
          />
        </div>

        {/* Col 3 : Pages vues */}
        <PageViewsTile series={stats.pageViewsSeries} badgeLabel={isLive ? "10 min" : periodLabel!} />

        {/* Col 4 : Comportement client */}
        <BehaviorTile stats={stats} badgeLabel={isLive ? "5 min" : periodLabel!} />
      </div>

      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(0.82); }
        }
      `}</style>
    </div>
  );
}
