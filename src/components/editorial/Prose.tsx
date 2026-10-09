import type { ReactNode } from "react";

/** Mise en forme sobre pour le contenu long (pages éditoriales & légales). */
export function Prose({ children }: { children: ReactNode }) {
  return (
    <div
      className="max-w-[720px] mx-auto px-6 md:px-0 pb-20
        [&_h2]:font-serif [&_h2]:text-[26px] [&_h2]:md:text-[30px] [&_h2]:text-ink [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:font-normal
        [&_h3]:font-sans [&_h3]:text-[12px] [&_h3]:tracking-[0.18em] [&_h3]:uppercase [&_h3]:text-champagne [&_h3]:mt-10 [&_h3]:mb-3
        [&_p]:font-sans [&_p]:text-[15px] [&_p]:md:text-[16px] [&_p]:leading-[1.85] [&_p]:text-warm-700 [&_p]:mb-4
        [&_ul]:font-sans [&_ul]:text-[15px] [&_ul]:leading-[1.85] [&_ul]:text-warm-700 [&_ul]:mb-4 [&_ul]:pl-5 [&_ul]:list-disc
        [&_li]:mb-1.5
        [&_a]:text-ink [&_a]:underline [&_a]:decoration-champagne [&_a]:underline-offset-2
        [&_strong]:text-ink [&_strong]:font-medium"
    >
      {children}
    </div>
  );
}
