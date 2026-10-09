"use client";

/*
 * Bandeau de consentement cookies (RGPD / CNIL).
 * Discret, non bloquant, ancré en bas. Affiché tant qu'aucun choix n'est fait.
 * Palette marque : fond ivoire/crème, texte encre, typo Jost (font-sans).
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useConsent } from "./ConsentProvider";
import { useHasMounted } from "@/lib/useHasMounted";
import { localizedPath, type Locale } from "@/lib/i18n";
import { t } from "@/lib/translations";

export function CookieBanner({ locale = "fr" }: { locale?: Locale }) {
  const { decided, acceptAll, rejectAll } = useConsent();
  const mounted = useHasMounted();
  const copy = t(locale).consent;
  const pathname = usePathname();

  // Jamais rendu côté serveur : le choix vit dans le localStorage, que le HTML
  // ne connaît pas. Sans ce garde-fou, une visiteuse ayant déjà accepté voyait
  // le bandeau réapparaître le temps de l'hydratation à chaque page.
  if (!mounted || decided || pathname?.startsWith("/admin")) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={copy.ariaLabel}
      className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-4 sm:px-6 sm:pb-6 animate-fade"
    >
      <div className="mx-auto max-w-[880px] rounded-md border border-sand-soft bg-ivory-light shadow-[0_8px_30px_rgba(22,19,15,0.12)]">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6">
          <div className="font-sans text-[13px] leading-[1.7] text-warm-700 sm:text-[13.5px]">
            <span className="mb-1 block font-medium text-ink">
              {copy.title}
            </span>
            {copy.body}{" "}
            <Link
              href={localizedPath("/confidentialite", locale)}
              className="text-ink underline decoration-champagne underline-offset-2"
            >
              {copy.policy}
            </Link>
            .
          </div>

          <div className="flex shrink-0 gap-3">
            <button
              type="button"
              onClick={rejectAll}
              className="rounded-sm border border-sand-soft px-5 py-2.5 font-sans text-[12px] uppercase tracking-[0.14em] text-warm-700 transition-colors hover:border-champagne hover:text-ink"
            >
              {copy.reject}
            </button>
            <button
              type="button"
              onClick={acceptAll}
              className="rounded-sm bg-ink px-5 py-2.5 font-sans text-[12px] uppercase tracking-[0.14em] text-ivory-light transition-colors hover:bg-champagne"
            >
              {copy.accept}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
