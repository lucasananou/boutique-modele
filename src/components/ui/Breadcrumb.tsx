import Link from "next/link";

export interface Crumb {
  label: string;
  href?: string;
}

/** Fil d'Ariane sobre, aligné sur la charte premium. */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav
      aria-label="Fil d'Ariane"
      className="font-sans text-[12px] text-warm-500 flex flex-wrap items-center gap-1.5"
    >
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <span key={i} className="inline-flex items-center gap-1.5">
            {item.href && !last ? (
              <Link
                href={item.href}
                className="hover:text-champagne transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className={last ? "text-ink" : ""} aria-current={last ? "page" : undefined}>
                {item.label}
              </span>
            )}
            {!last && <span aria-hidden>/</span>}
          </span>
        );
      })}
    </nav>
  );
}
