"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";

/* ---------- Pastille initiale (fallback générique) ---------- */
export function InitialChip({
  text,
  size = 26,
}: {
  text: string;
  size?: number;
}) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        background: "rgba(20,21,26,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        fontWeight: 600,
        color: "rgba(20,21,26,0.55)",
        flexShrink: 0,
      }}
    >
      {text.charAt(0).toUpperCase()}
    </span>
  );
}

/* ---------- Image avec repli ---------- */
function ImgWithFallback({
  src,
  fallback,
  alt = "",
  size = 26,
  radius = 6,
  cover = false,
}: {
  src: string;
  fallback: ReactNode;
  alt?: string;
  size?: number;
  radius?: number;
  cover?: boolean;
}) {
  const [err, setErr] = useState(false);
  if (err) return <>{fallback}</>;
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        overflow: "hidden",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fff",
        border: "1px solid rgba(20,21,26,0.06)",
      }}
    >
      <Image
        src={src}
        alt={alt}
        width={cover ? size : size - 8}
        height={cover ? size : size - 8}
        unoptimized
        onError={() => setErr(true)}
        style={{ objectFit: cover ? "cover" : "contain", display: "block" }}
      />
    </span>
  );
}

/* ---------- Drapeaux (flagcdn) ---------- */
const COUNTRY_ISO: Record<string, string> = {
  France: "fr", Belgique: "be", Suisse: "ch", Espagne: "es", Canada: "ca",
  "États-Unis": "us", "Royaume-Uni": "gb", Israël: "il", Allemagne: "de",
  Italie: "it", Portugal: "pt", "Pays-Bas": "nl", Maroc: "ma", Brésil: "br",
  Argentine: "ar", Australie: "au", Japon: "jp", Chine: "cn", Inde: "in",
  Égypte: "eg", Turquie: "tr", Russie: "ru", Irlande: "ie", Suède: "se",
  Norvège: "no", Grèce: "gr", Ukraine: "ua", Pologne: "pl", Algérie: "dz",
  Tunisie: "tn", Nigéria: "ng", "Afrique du Sud": "za", "Arabie saoudite": "sa",
  "Émirats arabes unis": "ae", Autriche: "at", Danemark: "dk", Luxembourg: "lu",
  Mexique: "mx", Chili: "cl", Colombie: "co", Thaïlande: "th", Indonésie: "id",
  Singapour: "sg", "Corée du Sud": "kr",
};

export function CountryFlag({ name, size = 26 }: { name: string; size?: number }) {
  const iso = COUNTRY_ISO[name];
  if (!iso) return <InitialChip text={name} size={size} />;
  return (
    <ImgWithFallback
      src={`https://flagcdn.com/60x45/${iso}.png`}
      fallback={<InitialChip text={name} size={size} />}
      alt={name}
      size={size}
      radius={5}
      cover
    />
  );
}

/* ---------- Sources / réseaux (favicons Google S2 = vrais logos) ---------- */
const SOURCE_DOMAIN: Record<string, string> = {
  Google: "google.com",
  Instagram: "instagram.com",
  Facebook: "facebook.com",
  TikTok: "tiktok.com",
  YouTube: "youtube.com",
  Pinterest: "pinterest.com",
  "Twitter / X": "x.com",
};

export function SourceIcon({ name, size = 26 }: { name: string; size?: number }) {
  if (name === "Direct") {
    return (
      <span
        style={{
          width: size,
          height: size,
          borderRadius: 8,
          background: "rgba(20,21,26,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          color: "rgba(20,21,26,0.5)",
        }}
      >
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.5 2.5 15.5 0 18M12 3c-2.5 2.5-2.5 15.5 0 18" />
        </svg>
      </span>
    );
  }
  // Domaine connu, sinon on tente le libellé comme hostname
  const domain = SOURCE_DOMAIN[name] ?? (name.includes(".") ? name : null);
  if (!domain) return <InitialChip text={name} size={size} />;
  return (
    <ImgWithFallback
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
      fallback={<InitialChip text={name} size={size} />}
      alt={name}
      size={size}
    />
  );
}

/* ---------- Navigateurs (marques, en CSS/SVG, sans dépendance externe) ---------- */
export function BrowserIcon({ name, size = 26 }: { name: string; size?: number }) {
  const wrap = (children: ReactNode, bg?: string): ReactNode => (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        background: bg,
        overflow: "hidden",
      }}
    >
      {children}
    </span>
  );

  const n = name.toLowerCase();

  if (n.includes("chrome")) {
    return wrap(
      <>
        <span
          style={{
            position: "absolute",
            inset: 0,
            background:
              "conic-gradient(from -60deg, #ea4335 0 120deg, #4285f4 120deg 240deg, #34a853 240deg 360deg)",
          }}
        />
        <span
          style={{
            position: "absolute",
            inset: 0,
            background:
              "conic-gradient(from -60deg, #fbbc05 0 120deg, transparent 120deg 360deg)",
            opacity: 0.9,
          }}
        />
        <span
          style={{
            position: "relative",
            width: size * 0.44,
            height: size * 0.44,
            borderRadius: "50%",
            background: "#4285f4",
            border: "2px solid #fff",
          }}
        />
      </>,
    );
  }

  if (n.includes("firefox")) {
    return wrap(
      <span
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at 65% 35%, #ffcf0f, #ff7139 45%, #e2361b 80%)",
        }}
      />,
    );
  }

  if (n.includes("edg")) {
    return wrap(
      <span
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, #0f9bd7 0%, #1264cf 55%, #2bd07a 120%)",
        }}
      />,
    );
  }

  if (n.includes("opera")) {
    return wrap(
      <span style={{ position: "absolute", inset: 0, background: "#fb0f3b" }}>
        <span
          style={{
            position: "absolute",
            top: "18%",
            left: "32%",
            width: "36%",
            height: "64%",
            borderRadius: "50%",
            background: "#fff",
          }}
        />
      </span>,
    );
  }

  if (n.includes("safari")) {
    return wrap(
      <>
        <span
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 50% 50%, #4aa3ff, #1e77e6)",
          }}
        />
        <span
          style={{
            position: "relative",
            width: 0,
            height: 0,
            borderLeft: `${size * 0.11}px solid transparent`,
            borderRight: `${size * 0.11}px solid transparent`,
            borderBottom: `${size * 0.3}px solid #fff`,
            transform: "rotate(45deg) translateY(-8%)",
          }}
        />
        <span
          style={{
            position: "absolute",
            width: 0,
            height: 0,
            borderLeft: `${size * 0.11}px solid transparent`,
            borderRight: `${size * 0.11}px solid transparent`,
            borderTop: `${size * 0.3}px solid #ff4b4b`,
            transform: "rotate(45deg) translateY(8%)",
          }}
        />
      </>,
    );
  }

  // Autre → globe gris
  return wrap(
    <span style={{ color: "rgba(20,21,26,0.5)" }}>
      <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
      </svg>
    </span>,
    "rgba(20,21,26,0.07)",
  );
}

/* ---------- Icône page ---------- */
export function PageIcon({ size = 26 }: { size?: number }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: 8,
        background: "rgba(20,21,26,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        color: "rgba(20,21,26,0.5)",
      }}
    >
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5M8.5 13h7M8.5 17h7" />
      </svg>
    </span>
  );
}
