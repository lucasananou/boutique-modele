import localFont from "next/font/local";

/* Polices de l'admin (la vitrine charge les siennes dans style.css). Contrat : --font-serif-src, --font-sans-src, --font-hebrew-src. */
const serif = localFont({ src: "../../../public/stores/monjolibola/fonts/newsreader.woff2", variable: "--font-serif-src", weight: "300 500", display: "swap", preload: false });
const sans = localFont({ src: "../../../public/stores/monjolibola/fonts/albertsans.woff2", variable: "--font-sans-src", weight: "300 500", display: "swap", preload: false });
const hebrew = localFont({ src: "../../../public/stores/monjolibola/fonts/albertsans.woff2", variable: "--font-hebrew-src", weight: "300 500", display: "swap", preload: false });

export const fontVariables = `${serif.variable} ${sans.variable} ${hebrew.variable}`;
