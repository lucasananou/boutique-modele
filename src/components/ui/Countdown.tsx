"use client";

import { useEffect, useState } from "react";

function diffParts(target: number, now: number) {
  let d = Math.max(0, target - now);
  const days = Math.floor(d / 86_400_000);
  d -= days * 86_400_000;
  const hours = Math.floor(d / 3_600_000);
  d -= hours * 3_600_000;
  const minutes = Math.floor(d / 60_000);
  d -= minutes * 60_000;
  const seconds = Math.floor(d / 1000);
  return { days, hours, minutes, seconds };
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Compte à rebours pilotable (alimenté par la table FlashSale).
 * `endsAt` : date ISO. `variant` : "boxes" (home) ou "inline" (fiche produit).
 */
export function Countdown({
  endsAt,
  variant = "boxes",
}: {
  endsAt: string;
  variant?: "boxes" | "inline";
}) {
  const target = new Date(endsAt).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const raf = requestAnimationFrame(tick); // 1re valeur hors corps d'effet
    const t = setInterval(tick, 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(t);
    };
  }, []);

  // Avant montage (SSR / hydratation), on calcule sur la cible pour éviter le
  // décalage : valeurs figées tant que `now` n'est pas défini côté client.
  const { days, hours, minutes, seconds } = diffParts(target, now ?? target);

  if (variant === "inline") {
    return (
      <strong className="text-champagne">
        {days > 0 ? `${days}j ` : ""}
        {pad(hours)}h {pad(minutes)}m {pad(seconds)}s
      </strong>
    );
  }

  const cells: [number, string][] = [
    [days, "Jours"],
    [hours, "Heures"],
    [minutes, "Min"],
    [seconds, "Sec"],
  ];

  return (
    <div className="flex gap-2">
      {cells.map(([value, label], i) => (
        <div
          key={label}
          className={[
            "min-w-[54px] px-1.5 py-2.5 text-center text-ivory-light",
            i === cells.length - 1 ? "bg-champagne" : "bg-ink",
          ].join(" ")}
        >
          <div className="font-serif text-[26px] leading-none">
            {pad(value)}
          </div>
          <div className="font-sans text-[9px] tracking-[0.18em] opacity-70 mt-1">
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}
