"use client";

import { useState } from "react";
import { t } from "@/lib/translations";
import type { Locale } from "@/lib/i18n";

export function Faq({ locale = "fr" }: { locale?: Locale }) {
  const copy = t(locale).homePage.faq;
  const [open, setOpen] = useState(0);
  return (
    <section
      id="faq"
      className="max-w-[880px] mx-auto px-6 md:px-10 pt-12 md:pt-16 pb-20 md:pb-24 scroll-mt-28"
    >
      <div className="text-center mb-12">
        <div className="eyebrow mb-3.5">{copy.eyebrow}</div>
        <h2 className="font-serif font-medium text-[34px] md:text-[46px] leading-none text-ink">
          {copy.h2}
        </h2>
      </div>
      <div>
        {copy.items.map((f, i) => {
          const isOpen = open === i;
          const panelId = `faq-panel-${i}`;
          const btnId = `faq-btn-${i}`;
          return (
            <div key={f.q} className="border-t border-sand-soft">
              <h3 className="m-0">
                <button
                  id={btnId}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="w-full text-left py-6 cursor-pointer flex justify-between items-center gap-5"
                >
                  <span className="font-serif text-[22px] md:text-[24px] leading-[1.2] text-ink">
                    {f.q}
                  </span>
                  <span
                    aria-hidden="true"
                    className="font-serif text-[24px] text-champagne leading-none shrink-0"
                  >
                    {isOpen ? "–" : "+"}
                  </span>
                </button>
              </h3>
              <div
                id={panelId}
                role="region"
                aria-labelledby={btnId}
                hidden={!isOpen}
              >
                <p className="font-sans text-[15px] leading-[1.7] text-warm-700 pb-6 -mt-1 max-w-[680px]">
                  {f.a}
                </p>
              </div>
            </div>
          );
        })}
        <div className="border-t border-sand-soft" />
      </div>
    </section>
  );
}
