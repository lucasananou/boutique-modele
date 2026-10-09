/*
 * Loader next/image → Cloudinary (mode « fetch »).
 * Cloudinary va chercher l'image distante (ex. le domaine de la boutique) UNE fois, la met
 * en cache sur son CDN et la sert optimisée (format/qualité/taille auto). Le site
 * d'origine n'est donc plus sollicité par les visiteurs.
 *
 * Le « cloud name » n'est pas un secret (il apparaît dans les URLs publiques).
 * Aucune clé API n'est nécessaire pour le mode fetch.
 */
const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "da3qczqep";

export default function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  // Images locales (public/) : Next impose que le custom loader encode width.
  // Le fichier reste servi par Next, le query param sert seulement au srcset.
  if (!src) return src;
  if (src.startsWith("/")) {
    const join = src.includes("?") ? "&" : "?";
    return `${src}${join}w=${width}${quality ? `&q=${quality}` : ""}`;
  }

  const params = [
    "f_auto", // format auto (avif/webp)
    `q_${quality || "auto"}`, // qualité auto
    "c_limit", // ne jamais agrandir au-delà de la source
    `w_${width}`, // largeur demandée par next/image (srcset)
  ].join(",");

  // Image déjà stockée sur Cloudinary (mode upload) : on injecte les
  // transformations responsives après /image/upload/.
  const UPLOAD = "/image/upload/";
  if (src.includes("res.cloudinary.com") && src.includes(UPLOAD)) {
    const [base, rest] = src.split(UPLOAD);
    if (/^(f_|q_|w_|c_|e_|dpr_)/.test(rest)) return src; // déjà transformée
    return `${base}${UPLOAD}${params}/${rest}`;
  }
  // URL Cloudinary déjà construite (fetch) : ne pas ré-encapsuler.
  if (src.includes("res.cloudinary.com")) return src;

  // Fallback : image distante non encore migrée → mode fetch.
  return `https://res.cloudinary.com/${CLOUD}/image/fetch/${params}/${encodeURIComponent(
    src,
  )}`;
}
