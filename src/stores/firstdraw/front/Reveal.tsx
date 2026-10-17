import type { ReactNode } from "react";

/* Scroll reveal, done with native CSS scroll-driven animation (see
   globals.css, .reveal). One motivated use: content enters in reading
   order as the visitor arrives at a section. No JavaScript, so the
   content is never hidden behind hydration, and it collapses to static
   under prefers-reduced-motion or on browsers without view() support. */

export default function Reveal({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div id={id} className={className ? `reveal ${className}` : "reveal"}>
      {children}
    </div>
  );
}
