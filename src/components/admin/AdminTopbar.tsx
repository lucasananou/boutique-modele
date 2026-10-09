"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/currency";
import type { TopbarMetric, TopbarPeriod, TopbarSnapshot } from "@/lib/live/topbar";

/**
 * Barre de pilotage visible par les seuls administrateurs, en tête de la
 * boutique : sessions, chiffre d'affaires et commandes de la période, comparés
 * à la période précédente. Permet de suivre l'activité en naviguant sur le site
 * plutôt qu'en gardant le dashboard ouvert à côté.
 */

const PERIOD_LABELS: Record<TopbarPeriod, string> = {
  today: "Aujourd'hui",
  "7d": "7 derniers jours",
  "30d": "30 derniers jours",
};

/** Variation en %, ou null quand la période précédente est vide (division impossible). */
function delta(m: TopbarMetric): number | null {
  if (m.previous === 0) return m.value === 0 ? 0 : null;
  return Math.round(((m.value - m.previous) / m.previous) * 100);
}

function Sparkline({ series, positive }: { series: number[]; positive: boolean }) {
  const max = Math.max(...series, 1);
  const w = 46;
  const h = 18;
  const step = series.length > 1 ? w / (series.length - 1) : w;
  const points = series
    .map((v, i) => `${(i * step).toFixed(1)},${(h - (v / max) * (h - 2) - 1).toFixed(1)}`)
    .join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={positive ? "#2f7d55" : "#c0392b"}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Metric({
  label,
  value,
  metric,
}: {
  label: string;
  value: string;
  metric: TopbarMetric;
}) {
  const d = delta(metric);
  const positive = (d ?? 0) >= 0;

  return (
    <div className="flex items-center gap-2.5 rounded-full border border-ink/10 bg-white px-3.5 py-1.5">
      <span className="font-sans text-[10px] tracking-[0.12em] uppercase text-warm-500 whitespace-nowrap">
        {label}
      </span>
      <span className="font-sans text-[13px] text-ink whitespace-nowrap">{value}</span>
      {d !== null && (
        <span
          className={[
            "font-sans text-[11px] rounded-full px-1.5 py-0.5 whitespace-nowrap",
            positive ? "text-[#2f7d55] bg-[#2f7d55]/10" : "text-[#c0392b] bg-[#c0392b]/10",
          ].join(" ")}
        >
          {positive ? "+" : ""}
          {d}%
        </span>
      )}
      <Sparkline series={metric.series} positive={positive} />
    </div>
  );
}

export function AdminTopbar({ initial }: { initial: TopbarSnapshot }) {
  const [snapshot, setSnapshot] = useState(initial);
  const [pending, startTransition] = useTransition();

  function changePeriod(period: TopbarPeriod) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/live/topbar?period=${period}`, { cache: "no-store" });
        if (res.ok) setSnapshot(await res.json());
      } catch {
        // Barre d'information : un échec réseau ne doit rien casser côté boutique.
      }
    });
  }

  const orders = snapshot.orders.value;

  return (
    <div className="bg-ivory-light border-b border-ink/10">
      <div className="flex items-center gap-3 px-4 py-2.5 overflow-x-auto">
        <label className="sr-only" htmlFor="admin-topbar-period">
          Période
        </label>
        <select
          id="admin-topbar-period"
          value={snapshot.period}
          onChange={(e) => changePeriod(e.target.value as TopbarPeriod)}
          className="rounded-full border border-ink/10 bg-white px-3.5 py-1.5 font-sans text-[13px] text-ink cursor-pointer outline-none focus:border-champagne"
        >
          {(Object.keys(PERIOD_LABELS) as TopbarPeriod[]).map((p) => (
            <option key={p} value={p}>
              {PERIOD_LABELS[p]}
            </option>
          ))}
        </select>

        <div
          className={[
            "flex items-center gap-2.5 transition-opacity",
            pending ? "opacity-50" : "opacity-100",
          ].join(" ")}
        >
          <Metric
            label="Sessions uniques"
            value={String(snapshot.sessions.value)}
            metric={snapshot.sessions}
          />
          <Metric
            label="CA"
            value={formatMoney(snapshot.revenue.value, "EUR", "fr")}
            metric={snapshot.revenue}
          />
          <Metric
            label="Commandes"
            value={`${orders} comm.`}
            metric={snapshot.orders}
          />
        </div>

        <Link
          href="/admin"
          className="ms-auto shrink-0 rounded-full border border-ink/15 bg-white px-4 py-1.5 font-sans text-[13px] text-ink hover:border-ink transition-colors"
        >
          Admin
        </Link>
      </div>
    </div>
  );
}
