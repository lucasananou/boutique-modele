"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";

interface Heading {
  id: string;
  text: string;
}

/** Slug ASCII stable à partir d'un titre (pour l'ancre #id). */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

/**
 * Sommaire ancré + scroll-spy. Le corps de l'article est du JSX serveur opaque :
 * on scanne donc les <h2> rendus côté client pour poser les ancres et construire
 * le sommaire, puis un IntersectionObserver surligne la section active.
 *
 * (Les setState vivent dans une IIFE async / des callbacks d'observer pour rester
 *  conformes à react-hooks/set-state-in-effect.)
 */
const labels: Record<Locale, { toc: string; share: string }> = {
  fr: { toc: "Dans cet article", share: "Partager" },
  en: { toc: "In this article", share: "Share" },
  he: { toc: "במאמר הזה", share: "שיתוף" },
};

export function ArticleToc({
  targetId = "article-body",
  locale = "fr",
}: {
  targetId?: string;
  locale?: Locale;
}) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [shareUrl, setShareUrl] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const container = document.getElementById(targetId);
      if (!container) return;
      const used = new Set<string>();
      const list: Heading[] = [];
      for (const h of Array.from(container.querySelectorAll("h2"))) {
        const base = h.id || slugify(h.textContent || "");
        if (!base) continue;
        let unique = base;
        let i = 2;
        while (used.has(unique)) unique = `${base}-${i++}`;
        used.add(unique);
        if (!h.id) h.id = unique;
        list.push({ id: unique, text: (h.textContent || "").trim() });
      }
      if (!cancelled) {
        setHeadings(list);
        setShareUrl(window.location.href);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [targetId]);

  useEffect(() => {
    if (!headings.length) return;
    const els = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          );
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -68% 0px", threshold: 0 },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <aside className="hidden lg:block sticky top-7 self-start">
      <div className="font-sans text-[10px] tracking-[0.22em] uppercase text-champagne mb-4">
        {labels[locale].toc}
      </div>
      <nav className="grid gap-3">
        {headings.map((h) => {
          const active = h.id === activeId;
          return (
            <a
              key={h.id}
              href={`#${h.id}`}
              className={[
                "font-sans text-[13px] leading-snug pl-3 border-l transition-colors",
                active
                  ? "text-ink border-champagne"
                  : "text-warm-500 border-[rgba(26,24,21,0.14)] hover:text-ink",
              ].join(" ")}
            >
              {h.text}
            </a>
          );
        })}
      </nav>
      {shareUrl && (
        <div className="mt-7 pt-5 border-t border-[rgba(26,24,21,0.14)] font-sans text-[12px] text-warm-500">
          {labels[locale].share}
          <div className="flex gap-3 mt-2 text-ink">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-champagne transition-colors"
            >
              WhatsApp
            </a>
            <span className="text-warm-500">·</span>
            <a
              href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-champagne transition-colors"
            >
              Pinterest
            </a>
          </div>
        </div>
      )}
    </aside>
  );
}
