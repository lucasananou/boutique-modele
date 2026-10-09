import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "solid" | "outline" | "outline-light" | "ghost" | "link";

const base =
  "inline-flex items-center justify-center font-sans text-[13px] tracking-[0.04em] transition-colors duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  // sombre plein → champagne au survol (CTA principal)
  solid:
    "bg-ink text-ivory-light px-7 py-4 rounded-xs uppercase tracking-[0.08em] hover:bg-champagne",
  // clair plein (sur fond sombre/image)
  outline:
    "bg-ivory text-ink px-7 py-4 rounded-xs hover:bg-white",
  // contour clair sur image
  "outline-light":
    "text-ivory-light px-6 py-4 rounded-xs border border-white/45 hover:border-white",
  ghost:
    "text-ink px-4 py-2 hover:text-champagne",
  // lien souligné champagne
  link: "text-ink uppercase tracking-[0.08em] border-b border-champagne pb-1 hover:text-champagne",
};

interface CommonProps {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

export function Button({
  variant = "solid",
  children,
  className = "",
  ...rest
}: CommonProps & ComponentProps<"button">) {
  return (
    <button
      className={[base, variants[variant], className].join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "solid",
  children,
  className = "",
  href,
  ...rest
}: CommonProps & ComponentProps<typeof Link>) {
  return (
    <Link
      href={href}
      className={[base, variants[variant], className].join(" ")}
      {...rest}
    >
      {children}
    </Link>
  );
}
