"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/lib/store/cart";
import { hasCaptured, exitShown, markExitShown } from "@/lib/leadCapture";
import { LeadCaptureForm } from "./LeadCaptureForm";
import { usePathname } from "next/navigation";
import { localeFromPathname } from "@/lib/i18n";

/**
 * Popup « exit-intent » : quand le visiteur s'apprête à quitter (souris qui sort
 * par le haut), on propose de garder son panier contre son e-mail (+ −10 %).
 * Desktop uniquement (le DnD tactile n'a pas d'exit-intent fiable), une seule
 * fois par session, seulement si le panier n'est pas vide et l'e-mail non capturé.
 */
export function ExitIntentCapture() {
  const [open, setOpen] = useState(false);
  const locale = localeFromPathname(usePathname());

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    function onLeave(e: MouseEvent) {
      if (e.clientY > 0) return;
      if (exitShown() || hasCaptured()) return;
      if (useCart.getState().lines.length === 0) return;
      markExitShown();
      setOpen(true);
    }

    document.addEventListener("mouseout", onLeave);
    return () => document.removeEventListener("mouseout", onLeave);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-5">
      <div
        className="absolute inset-0 bg-ink/50"
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <div
        role="dialog"
        aria-label="Gardez votre panier"
        className="relative bg-ivory-light w-full max-w-[440px] rounded-sm p-8 md:p-10 text-center shadow-[0_30px_80px_-20px_rgba(28,23,18,0.5)]"
      >
        <button
          onClick={() => setOpen(false)}
          aria-label="Fermer"
          className="absolute top-4 right-4 text-warm-500 hover:text-ink transition-colors cursor-pointer"
        >
          ✕
        </button>
        <div className="font-sans text-[11px] tracking-[0.28em] uppercase text-champagne mb-3">
          Ne partez pas les mains vides
        </div>
        <h2 className="font-serif text-[26px] md:text-[30px] text-ink mb-2.5">
          Gardez votre panier + −10 %
        </h2>
        <p className="font-sans text-[13.5px] text-warm-500 leading-[1.6] mb-6">
          Laissez-nous votre e-mail : on garde votre sélection et on vous envoie{" "}
          <strong className="text-ink">−10 %</strong> sur votre commande.
        </p>
        <LeadCaptureForm autoFocus locale={locale} onDone={() => setOpen(false)} />
      </div>
    </div>
  );
}
