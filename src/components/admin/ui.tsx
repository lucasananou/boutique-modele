import type { ReactNode } from "react";

/*
  Primitives partagées de l'admin. Les couleurs passent par les variables CSS
  scellées à `.admin-root` (voir globals.css) → thème clair/sombre automatique.
  Les cartes portent `data-ad-surface` pour que le mode compact resserre leurs
  paddings (règle `.admin-root[data-compact] [data-ad-surface]`).
*/

export const card: React.CSSProperties = {
  background: "var(--ad-surface)",
  border: "1px solid var(--ad-border)",
  borderRadius: 15,
};

export function Card({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div data-ad-surface className={className} style={{ ...card, ...style }}>
      {children}
    </div>
  );
}

export function PageTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-6 mb-8">
      <div>
        <h1 className="m-0 text-[29px] font-semibold tracking-[-0.03em]">
          {title}
        </h1>
        {subtitle && (
          <p
            className="mt-[7px] text-[15px]"
            style={{ color: "rgb(var(--ad-ink-rgb) / 0.56)" }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function StatusPill({
  label,
  bg,
  fg,
}: {
  label: string;
  bg: string;
  fg: string;
}) {
  return (
    <span
      className="inline-flex items-center px-[10px] py-[3px] rounded-full text-[11.5px] font-medium whitespace-nowrap"
      style={{ background: bg, color: fg }}
    >
      {label}
    </span>
  );
}

export function Mono({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={className}
      style={{ fontFamily: "var(--font-geist-mono), monospace", ...style }}
    >
      {children}
    </span>
  );
}

export function MetricCard({
  label,
  value,
  delta,
  deltaColor,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaColor?: string;
}) {
  return (
    <Card className="px-[19px] py-[18px]">
      <div
        className="text-[10.5px] tracking-[0.13em] uppercase"
        style={{
          fontFamily: "var(--font-geist-mono), monospace",
          color: "rgb(var(--ad-ink-rgb) / 0.42)",
        }}
      >
        {label}
      </div>
      <div className="mt-[13px] text-[25px] font-semibold tracking-[-0.02em]">
        {value}
      </div>
      {delta && (
        <div
          className="mt-[7px] text-[12.5px] font-medium"
          style={{ color: deltaColor ?? "rgb(var(--ad-ink-rgb) / 0.5)" }}
        >
          {delta}
        </div>
      )}
    </Card>
  );
}

/** Pastille colorée (placeholder visuel produit). */
export function Swatch({
  seed,
  size = 32,
  radius = 8,
}: {
  seed: string;
  size?: number;
  radius?: number;
}) {
  const palette = [
    "#3a3f4b",
    "#c7b9a3",
    "#9aa0a6",
    "#2b2f36",
    "#b7a98f",
    "#d8cfc2",
    "#4a4f57",
    "#1c2030",
  ];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return (
    <span
      className="shrink-0 inline-block"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: palette[h % palette.length],
      }}
    />
  );
}

export const SectionHeading = ({ children }: { children: ReactNode }) => (
  <div className="text-[14px] font-semibold tracking-[-0.01em]">{children}</div>
);
