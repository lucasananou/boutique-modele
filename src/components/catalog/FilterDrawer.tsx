"use client";

import { useEffect, useRef } from "react";
import { CloseIcon } from "@/components/ui/icons";
import type { Locale } from "@/lib/i18n";
import { interpolate, t } from "@/lib/translations";

interface Props {
  open: boolean;
  onClose: () => void;
  resultCount: number;
  children: React.ReactNode;
  locale?: Locale;
}

/**
 * Tiroir « Filtrer » coulissant depuis la droite (tous écrans). Accessible :
 * role dialog/modal, focus trap, Escape pour fermer, scroll de fond bloqué,
 * focus rendu au déclencheur. Les filtres vivent dans l'URL → fermer ne perd
 * jamais la sélection.
 */
export function FilterDrawer({ open, onClose, resultCount, children, locale = "fr" }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const copy = t(locale);

  // Référence stable vers onClose : l'effet ci-dessous ne dépend que de `open`,
  // donc appliquer un filtre (qui recrée onClose) ne relance pas l'effet
  // (pas de saut de focus ni de flicker de scroll).
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = panel.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      previouslyFocused?.focus?.();
    };
    // Volontairement [open] seul : onClose est lu via onCloseRef (stable).
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Voile */}
      <button
        type="button"
        aria-label={copy.nav.close}
        onClick={onClose}
        className="absolute inset-0 bg-ink/40 animate-fade cursor-default"
        tabIndex={-1}
      />

      {/* Panneau coulissant (droite) */}
      <div
        ref={panelRef}
        id="catalog-filter-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={copy.catalog.filter}
        className="absolute top-0 right-0 bottom-0 w-full max-w-[420px] flex flex-col bg-ivory shadow-[-30px_0_60px_-30px_rgba(22,19,15,0.45)] animate-fade"
        style={{ animationDuration: "0.28s" }}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-sand-soft">
          <span className="font-serif text-[20px] text-ink">{copy.catalog.filter}</span>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={copy.nav.close}
            className="flex items-center justify-center w-11 h-11 -mr-2 text-ink hover:text-champagne transition-colors cursor-pointer"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>

        <div className="px-6 py-4 border-t border-ink/10">
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[52px] font-sans text-[13px] tracking-[0.08em] uppercase text-ivory-light bg-ink rounded-xs hover:bg-champagne transition-colors cursor-pointer"
          >
            {interpolate(copy.catalog.seeResults, {
              count: resultCount,
              plural: locale === "fr" && resultCount > 1 ? "s" : locale === "en" && resultCount !== 1 ? "s" : "",
            })}
          </button>
        </div>
      </div>
    </div>
  );
}
