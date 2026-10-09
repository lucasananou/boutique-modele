import Link from "next/link";
import { localizedPath, type Locale } from "@/lib/i18n";
import { t } from "@/lib/translations";

interface Props {
  /** Page courante (1-based, déjà clampée). */
  page: number;
  /** Nombre total de pages (≥ 1). */
  totalPages: number;
  /** Chemin de base (ex. « /robes »). */
  basePath: string;
  /**
   * searchParams courants (bruts) hors `page` — préservés dans chaque lien
   * (filtres/tri conservés). `page` est ajouté/retiré ici.
   */
  searchParams: Record<string, string | string[] | undefined>;
  locale?: Locale;
}

/**
 * Contrôles de pagination 100 % côté serveur : de simples <Link> dont le href
 * reprend les searchParams courants + `page`. Aucun état client, crawlable.
 * Rendu uniquement si `totalPages > 1`.
 */
export function Pagination({ page, totalPages, basePath, searchParams, locale = "fr" }: Props) {
  if (totalPages <= 1) return null;
  const copy = t(locale);

  // Construit le href d'une page en préservant tous les autres params.
  // page 1 → on retire `page` (URL canonique propre) ; sinon `?…&page=N`.
  const hrefFor = (target: number): string => {
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (k === "page" || v == null) continue;
      if (Array.isArray(v)) {
        for (const item of v) usp.append(k, item);
      } else {
        usp.set(k, v);
      }
    }
    if (target > 1) usp.set("page", String(target));
    const qs = usp.toString();
    const href = qs ? `${basePath}?${qs}` : basePath;
    return localizedPath(href, locale);
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  const arrowBase =
    "font-sans text-[13px] tracking-[0.04em] transition-colors";
  const arrowActive = "text-[#5b554c] hover:text-[#6f5b46]";
  const arrowDisabled = "text-[#c8c2b6] pointer-events-none";

  return (
    <nav
      aria-label="Pagination"
      className="mt-12 flex items-center justify-center gap-4"
    >
      {prevDisabled ? (
        <span aria-disabled className={`${arrowBase} ${arrowDisabled}`}>
          ← {copy.common.previous}
        </span>
      ) : (
        <Link
          href={hrefFor(page - 1)}
          rel="prev"
          className={`${arrowBase} ${arrowActive}`}
        >
          ← {copy.common.previous}
        </Link>
      )}

      <ol className="flex items-center gap-1">
        {pages.map((n) => {
          const current = n === page;
          return (
            <li key={n}>
              {current ? (
                <span
                  aria-current="page"
                  className="inline-flex items-center justify-center min-w-[36px] h-9 px-2 font-sans text-[13px] text-ink border-b border-ink"
                >
                  {n}
                </span>
              ) : (
                <Link
                  href={hrefFor(n)}
                  className="inline-flex items-center justify-center min-w-[36px] h-9 px-2 font-sans text-[13px] text-[#9b9488] border-b border-transparent hover:text-[#6f5b46] hover:border-[#cdb89a] transition-colors"
                >
                  {n}
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      {nextDisabled ? (
        <span aria-disabled className={`${arrowBase} ${arrowDisabled}`}>
          {copy.common.next} →
        </span>
      ) : (
        <Link
          href={hrefFor(page + 1)}
          rel="next"
          className={`${arrowBase} ${arrowActive}`}
        >
          {copy.common.next} →
        </Link>
      )}
    </nav>
  );
}
