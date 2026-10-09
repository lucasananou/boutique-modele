"use client";

import { useEffect, useRef, useState } from "react";

export type PeriodKey = "live" | "today" | "48h" | "week" | "month" | "custom";

export interface PeriodSelection {
  key: PeriodKey;
  label: string;
  from?: string; // ISO
  to?: string; // ISO
}

export const LIVE_PERIOD: PeriodSelection = { key: "live", label: "En direct" };

const PRESETS: { key: PeriodKey; label: string }[] = [
  { key: "today", label: "Aujourd'hui" },
  { key: "48h", label: "48 heures" },
  { key: "week", label: "Cette semaine" },
  { key: "month", label: "Ce mois-ci" },
];

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function computePreset(key: PeriodKey): PeriodSelection {
  const now = new Date();
  const label = PRESETS.find((p) => p.key === key)?.label ?? "Période";
  let from = startOfToday();
  if (key === "48h") from = new Date(now.getTime() - 48 * 3600 * 1000);
  else if (key === "week") {
    from = startOfToday();
    const dow = (from.getDay() + 6) % 7; // lundi = 0
    from.setDate(from.getDate() - dow);
  } else if (key === "month") {
    from = startOfToday();
    from.setDate(1);
  }
  return { key, label, from: from.toISOString(), to: now.toISOString() };
}

function fmt(d: Date) {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export function LivePeriodSelector({
  value,
  onChange,
  loading,
}: {
  value: PeriodSelection;
  onChange: (p: PeriodSelection) => void;
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const isLive = value.key === "live";

  function pick(p: PeriodSelection) {
    onChange(p);
    setOpen(false);
  }

  function applyCustom() {
    if (!from || !to) return;
    const f = new Date(`${from}T00:00:00`);
    const t = new Date(`${to}T23:59:59`);
    if (Number.isNaN(f.getTime()) || Number.isNaN(t.getTime()) || f > t) return;
    pick({ key: "custom", label: `${fmt(f)} – ${fmt(t)}`, from: f.toISOString(), to: t.toISOString() });
  }

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 9,
          background: "#fff",
          border: "1px solid rgba(20,21,26,0.12)",
          borderRadius: 10,
          padding: "8px 13px",
          fontSize: 13.5,
          fontWeight: 500,
          color: "#14151a",
          cursor: "pointer",
          fontFamily: "inherit",
          boxShadow: "0 1px 2px rgba(20,21,26,0.04)",
        }}
      >
        <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{ opacity: 0.55 }}>
          <path d="M3 5h18M6 12h12M10 19h4" />
        </svg>
        {isLive && (
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#ef4444",
              boxShadow: "0 0 0 3px rgba(239,68,68,0.18)",
            }}
          />
        )}
        {loading ? "Chargement…" : value.label}
        <span style={{ fontSize: 9, opacity: 0.5 }}>▼</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            zIndex: 40,
            width: 258,
            background: "#fff",
            border: "1px solid rgba(20,21,26,0.1)",
            borderRadius: 14,
            boxShadow: "0 16px 44px rgba(20,21,26,0.16)",
            padding: 8,
          }}
        >
          <Option
            active={isLive}
            onClick={() => pick(LIVE_PERIOD)}
            dot="#ef4444"
            label="En direct"
          />
          {PRESETS.map((p) => (
            <Option
              key={p.key}
              active={value.key === p.key}
              onClick={() => pick(computePreset(p.key))}
              label={p.label}
            />
          ))}

          <div style={{ height: 1, background: "rgba(20,21,26,0.08)", margin: "8px 4px" }} />

          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "2px 8px 8px", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(20,21,26,0.4)" }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M3 10h18M8 2v4M16 2v4" />
            </svg>
            Calendrier
          </div>

          <DateField label="Début" value={from} onChange={setFrom} />
          <DateField label="Fin" value={to} onChange={setTo} />

          <button
            onClick={applyCustom}
            disabled={!from || !to}
            style={{
              width: "100%",
              marginTop: 8,
              padding: "9px",
              borderRadius: 9,
              border: "none",
              background: !from || !to ? "rgba(20,21,26,0.08)" : "#14151a",
              color: !from || !to ? "rgba(20,21,26,0.4)" : "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: !from || !to ? "default" : "pointer",
              fontFamily: "inherit",
            }}
          >
            Appliquer la période
          </button>
        </div>
      )}
    </div>
  );
}

function Option({
  active,
  onClick,
  label,
  dot,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  dot?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 10px",
        borderRadius: 9,
        border: "none",
        background: active ? "rgba(20,21,26,0.06)" : "transparent",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 13.5,
        color: "#14151a",
        textAlign: "left",
      }}
    >
      <span
        style={{
          width: 15,
          height: 15,
          borderRadius: 4,
          border: `1.5px solid ${active ? "#14151a" : "rgba(20,21,26,0.25)"}`,
          background: active ? "#14151a" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {active && <span style={{ width: 6, height: 6, borderRadius: 2, background: "#fff" }} />}
      </span>
      {dot && <span style={{ width: 7, height: 7, borderRadius: "50%", background: dot }} />}
      {label}
    </button>
  );
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label style={{ display: "block", padding: "4px 8px" }}>
      <span style={{ fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(20,21,26,0.4)" }}>
        {label}
      </span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          display: "block",
          width: "100%",
          marginTop: 4,
          padding: "7px 9px",
          borderRadius: 8,
          border: "1px solid rgba(20,21,26,0.14)",
          fontSize: 13,
          fontFamily: "inherit",
          color: "#14151a",
        }}
      />
    </label>
  );
}
