import { ImageResponse } from "next/og";
import { brand } from "@/lib/brand";
import { store } from "@/stores";

// Métadonnées de l'image Open Graph (1200×630).
export const alt = `${brand.name} — ${brand.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Palette de marque (config boutique, mêmes tokens que le site).
const BACKGROUND = store.theme.colors.ink ?? "#16130f"; // fond sombre
const CREAM = store.theme.colors["ink-soft"] ?? "#f3efe8"; // texte clair
const ACCENT = store.theme.colors.champagne ?? "#6f5b46"; // accent
// Logo texte : premier mot du nom (comme le header) + ville.
const WORDMARK = brand.name.split(" ")[0].toUpperCase();

// Génération à la volée — aucune police chargée (rendu police système, robuste).
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: BACKGROUND,
          color: CREAM,
          fontFamily: "serif",
        }}
      >
        {/* Liseré supérieur */}
        <div
          style={{
            position: "absolute",
            top: 56,
            left: 56,
            right: 56,
            height: 1,
            background: ACCENT,
          }}
        />
        {/* Liseré inférieur */}
        <div
          style={{
            position: "absolute",
            bottom: 56,
            left: 56,
            right: 56,
            height: 1,
            background: ACCENT,
          }}
        />

        {/* Wordmark */}
        <div
          style={{
            fontSize: 150,
            fontWeight: 600,
            letterSpacing: 28,
            lineHeight: 1,
            // Compense l'espacement à droite de la dernière lettre.
            paddingLeft: 28,
          }}
        >
          {WORDMARK}
        </div>

        {/* Sous-titre ville */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginTop: 28,
            color: ACCENT,
            fontSize: 40,
            letterSpacing: 18,
            paddingLeft: 18,
          }}
        >
          {brand.citySuffix.toUpperCase()}
        </div>

        {/* Baseline (tagline de marque) */}
        <div
          style={{
            marginTop: 44,
            maxWidth: 820,
            textAlign: "center",
            fontSize: 34,
            letterSpacing: 2,
            color: CREAM,
          }}
        >
          {brand.tagline}
        </div>
      </div>
    ),
    { ...size },
  );
}
