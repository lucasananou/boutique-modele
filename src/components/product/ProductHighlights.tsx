/**
 * Bloc « points forts » de la fiche produit : bandeau sombre + 3 garanties
 * communes à toutes les pièces (textes : translations.product.highlights*).
 * Affiché seulement si `sections.productHighlights` est vrai dans la config
 * de la boutique. Composant serveur, sans dépendance.
 */
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/translations";

export function ProductHighlights({ locale = "fr" }: { locale?: Locale }) {
  const copy = t(locale);
  const points = copy.product.highlights;
  return (
    <div className="rounded-md overflow-hidden border border-sand-soft">
      <div className="bg-ink px-6 py-5 flex items-center gap-3">
        <span aria-hidden className="text-champagne-light text-[22px] leading-none">
          ✦
        </span>
        <div>
          <div className="font-sans text-[10px] tracking-[0.24em] uppercase text-champagne-pale mb-1">
            {copy.product.highlightsEyebrow}
          </div>
          <div className="font-serif text-[20px] leading-none text-ivory-light">
            {copy.product.highlightsTitle}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 bg-ivory-light">
        {points.map((p, i) => (
          <div
            key={i}
            className={[
              "px-5 py-5 flex gap-3 items-start",
              i > 0 ? "border-t sm:border-t-0 sm:border-l border-sand-soft" : "",
            ].join(" ")}
          >
            <span
              aria-hidden
              className="shrink-0 w-[22px] h-[22px] rounded-full bg-ink text-ivory-light flex items-center justify-center text-[12px] mt-0.5"
            >
              ✓
            </span>
            <div>
              <div className="font-sans text-[14px] font-medium text-ink mb-0.5">
                {p.label}
              </div>
              <div className="font-sans text-[12.5px] leading-[1.5] text-warm-500">
                {p.text}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
