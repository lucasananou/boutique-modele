"use client";

import { useState } from "react";

/**
 * Vignette d'un article de commande (admin) : affiche la vraie image produit
 * si elle est disponible ET se charge, sinon une pastille de couleur (repli).
 * Beaucoup de produits ont encore des visuels Cloudinary morts → le repli
 * évite les images cassées.
 */
export function OrderItemThumb({
  src,
  seed,
  size = 40,
}: {
  src: string | null;
  seed: string;
  size?: number;
}) {
  const [broken, setBroken] = useState(false);

  // Miniature Cloudinary dimensionnée (largeur servie par le compte).
  const url =
    src && src.includes("/image/upload/")
      ? src.replace(
          "/image/upload/",
          "/image/upload/f_auto,q_auto,c_limit,w_256/",
        )
      : src;

  if (!url || broken) {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    const palette = ["#3a3f4b", "#c7b9a3", "#9aa0a6", "#2b2f36", "#b7a98f"];
    return (
      <span
        aria-hidden
        style={{
          width: size,
          height: size,
          borderRadius: 9,
          background: palette[h % palette.length],
          display: "block",
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onError={() => setBroken(true)}
      style={{
        width: size,
        height: size,
        objectFit: "cover",
        borderRadius: 9,
        background: "#efe8dc",
        flexShrink: 0,
      }}
    />
  );
}
