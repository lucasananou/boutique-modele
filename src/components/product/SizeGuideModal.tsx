"use client";

import { useEffect, useRef } from "react";
import { CloseIcon } from "@/components/ui/icons";
import { sizeRows, sizeColumns, lengthNotes } from "@/data/sizes";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/translations";

/** Modale « Guide des tailles » accessible (Escape, focus, scroll bloqué). */
export function SizeGuideModal({ onClose, locale = "fr" }: { onClose: () => void; locale?: Locale }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const copy = t(locale);
  const intro =
    locale === "en"
      ? "Measure your bust, waist and hips, then compare them with the chart. If you are between two sizes, choose the larger size for a more fluid drape."
      : locale === "he"
        ? "מדדי היקף חזה, מותן וירכיים והשווי לטבלה. אם את מתלבטת בין שתי מידות, בחרי במידה הגדולה יותר למראה רך ונוח."
        : "Mesurez votre tour de poitrine, de taille et de hanches, puis reportez-vous au tableau. En cas d'hésitation, choisissez la taille au-dessus pour un tombé fluide.";

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <button
        type="button"
        aria-label={copy.nav.close}
        onClick={onClose}
        className="absolute inset-0 bg-ink/40 animate-fade cursor-default"
        tabIndex={-1}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={copy.nav.sizeGuide}
        className="relative w-full sm:max-w-[560px] max-h-[88vh] overflow-y-auto bg-ivory rounded-t-2xl sm:rounded-lg shadow-[0_-20px_50px_-20px_rgba(22,19,15,0.45)] animate-fade"
        style={{ animationDuration: "0.25s" }}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-sand-soft sticky top-0 bg-ivory">
          <span className="font-serif text-[20px] text-ink">{copy.nav.sizeGuide}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label={copy.nav.close}
            className="flex items-center justify-center w-10 h-10 -mr-2 text-ink hover:text-champagne transition-colors cursor-pointer"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="px-6 py-6">
          <p className="font-sans text-[14px] leading-[1.7] text-warm-700 mb-5">
            {intro}
          </p>

          <div className="overflow-x-auto rounded-md border border-sand-soft">
            <table className="w-full text-left font-sans">
              <thead>
                <tr className="bg-mineral">
                  {sizeColumns.map((c) => (
                    <th
                      key={c}
                      className="font-sans text-[10.5px] tracking-[0.12em] uppercase text-warm-500 px-3 py-3 font-normal"
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sizeRows.map((r) => (
                  <tr key={r[0]} className="border-t border-sand-soft">
                    <td className="font-serif text-[16px] text-ink px-3 py-3">
                      {r[0]}
                    </td>
                    {r.slice(1).map((v, j) => (
                      <td
                        key={j}
                        className="font-sans text-[13.5px] text-ink px-3 py-3"
                      >
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            {lengthNotes.map(([t, d]) => (
              <div key={t}>
                <div className="font-serif text-[16px] text-ink">{t}</div>
                <p className="font-sans text-[13.5px] leading-[1.6] text-warm-700">
                  {d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
