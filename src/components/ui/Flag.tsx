import type { Locale } from "@/lib/i18n";

/**
 * Drapeaux vectoriels du sélecteur de langue.
 *
 * Les émojis drapeaux (🇫🇷) ne sont PAS rendus par Windows : la police système
 * n'a pas de glyphe pour les paires d'indicateurs régionaux, et le navigateur
 * retombe sur les deux lettres brutes (« FR », « GB », « IL »). Sur Mac et iOS
 * ils s'affichent, d'où un rendu incohérent d'un poste à l'autre.
 * Ces SVG s'affichent partout de la même façon.
 */
export function Flag({ locale, className = "" }: { locale: Locale; className?: string }) {
  const common = {
    viewBox: "0 0 21 15",
    className: ["shrink-0 rounded-[1px]", className].join(" "),
    "aria-hidden": true as const,
    focusable: "false" as const,
  };

  if (locale === "fr") {
    return (
      <svg {...common} width="21" height="15">
        <rect width="21" height="15" fill="#fff" />
        <rect width="7" height="15" fill="#002654" />
        <rect x="14" width="7" height="15" fill="#CE1126" />
      </svg>
    );
  }

  if (locale === "he") {
    return (
      <svg {...common} width="21" height="15">
        <rect width="21" height="15" fill="#fff" />
        <rect y="1.6" width="21" height="2.1" fill="#0038B8" />
        <rect y="11.3" width="21" height="2.1" fill="#0038B8" />
        {/* Étoile de David : deux triangles superposés, en trait fin */}
        <path
          d="M10.5 4.9l2.1 3.6h-4.2zM10.5 10.1l-2.1-3.6h4.2z"
          fill="none"
          stroke="#0038B8"
          strokeWidth="0.9"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // Royaume-Uni (anglais)
  return (
    <svg {...common} width="21" height="15">
      <rect width="21" height="15" fill="#012169" />
      {/* Diagonales blanches puis rouges */}
      <path d="M0 0l21 15M21 0L0 15" stroke="#fff" strokeWidth="3" />
      <path d="M0 0l21 15M21 0L0 15" stroke="#C8102E" strokeWidth="1.6" />
      {/* Croix blanche puis rouge */}
      <path d="M10.5 0v15M0 7.5h21" stroke="#fff" strokeWidth="5" />
      <path d="M10.5 0v15M0 7.5h21" stroke="#C8102E" strokeWidth="3" />
    </svg>
  );
}
