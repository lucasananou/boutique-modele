import { Archivo_Black, DM_Sans, Nothing_You_Could_Do } from "next/font/google";

/*
 * Polices de FIRST DRAW (système typographique « Mycel » de la maquette) :
 * Archivo Black pour les titres en capitales, DM Sans pour le texte, Nothing
 * You Could Do pour les notes manuscrites. Partagées par l'admin (layout
 * racine) et par la vitrine (front/index.tsx) : un seul jeu de fichiers.
 *
 * Contrat du modèle : --font-serif-src (titres) et --font-sans-src (texte).
 * --font-hebrew-src n'est pas défini : aucune page en hébreu.
 */

const display = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif-src",
  display: "swap",
});

const sans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans-src",
  display: "swap",
});

const hand = Nothing_You_Could_Do({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-hand-src",
  display: "swap",
});

export const fontVariables = `${display.variable} ${sans.variable} ${hand.variable}`;
