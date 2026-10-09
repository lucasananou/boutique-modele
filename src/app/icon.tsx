import { ImageResponse } from "next/og";
import { brand } from "@/lib/brand";
import { store } from "@/stores";

// Métadonnées du favicon généré (48×48).
export const size = { width: 48, height: 48 };
export const contentType = "image/png";

// Palette de marque.
const BACKGROUND = store.theme.colors.ink ?? "#16130f"; // fond sombre
const CREAM = store.theme.colors["ink-soft"] ?? "#f3efe8"; // monogramme clair

// Génération à la volée — monogramme (initiale du nom) clair sur fond sombre.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BACKGROUND,
          color: CREAM,
          fontFamily: "serif",
          fontSize: 34,
          fontWeight: 600,
        }}
      >
        {brand.name.trim().charAt(0).toUpperCase()}
      </div>
    ),
    { ...size },
  );
}
