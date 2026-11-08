import localFont from "next/font/local";

/*
 * Polices de l'admin Aoyuki (la vitrine charge les siennes depuis la maquette).
 * Contrat : variables --font-serif-src, --font-sans-src, --font-hebrew-src
 * (src/app/globals.css). preload: false : rien de plus à télécharger sur la vitrine.
 */

const serif = localFont({
  src: "../../../public/stores/aoyuki/fonts/fraunces-600.woff2",
  variable: "--font-serif-src",
  weight: "600",
  display: "swap",
  preload: false,
});

const sans = localFont({
  src: "../../../public/stores/aoyuki/fonts/dmsans.woff2",
  variable: "--font-sans-src",
  weight: "400 700",
  display: "swap",
  preload: false,
});

const hebrew = localFont({
  src: "../../../public/stores/aoyuki/fonts/dmsans.woff2",
  variable: "--font-hebrew-src",
  weight: "400 700",
  display: "swap",
  preload: false,
});

export const fontVariables = `${serif.variable} ${sans.variable} ${hebrew.variable}`;
