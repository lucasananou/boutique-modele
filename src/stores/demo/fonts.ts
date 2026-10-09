import { Inter, Noto_Sans_Hebrew, Playfair_Display } from "next/font/google";

/*
 * Polices de Boutique Démo. Contrat : définir les variables CSS --font-serif-src,
 * --font-sans-src et --font-hebrew-src (lues par src/app/globals.css) ;
 * importé uniquement par src/app/layout.tsx via src/stores/current-fonts.ts.
 * Changer de police : remplacer l'import et l'appel (Google Fonts, options
 * littérales obligatoires), en gardant les trois variables CSS.
 */

const serif = Playfair_Display({
  variable: "--font-serif-src",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const sans = Inter({
  variable: "--font-sans-src",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const hebrew = Noto_Sans_Hebrew({
  variable: "--font-hebrew-src",
  subsets: ["hebrew"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const fontVariables = `${serif.variable} ${sans.variable} ${hebrew.variable}`;
