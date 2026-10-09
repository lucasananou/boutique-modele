import type { NextConfig } from "next";
import { store } from "./src/stores";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  images: {
    // Livraison via Cloudinary (mode fetch) : voir src/lib/cloudinaryLoader.ts.
    // Cloudinary gère format/qualité/taille ; le CDN sert les images optimisées.
    loader: "custom",
    loaderFile: "./src/lib/cloudinaryLoader.ts",
  },
  // En-têtes de sécurité (audit §1.12) : pas d'affichage dans une iframe tierce
  // (clickjacking de l'admin), HTTPS forcé, pas de fuite d'URL complète.
  // Ne pas restreindre `payment` (Apple Pay / Google Pay via Stripe).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  // Redirections 301 propres à la boutique (anciennes URLs) : config boutique.
  async redirects() {
    return store.redirects;
  },
};

export default nextConfig;
