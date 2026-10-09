import "server-only";
import crypto from "node:crypto";
import { store } from "@/stores";

/*
 * Upload signé vers Cloudinary — sans dépendance (API REST + signature SHA-1).
 * Le secret ne quitte jamais le serveur. Voir aussi src/lib/cloudinaryLoader.ts
 * (livraison/optimisation côté client, qui ne nécessite, elle, aucune clé).
 */

const CLOUD =
  process.env.CLOUDINARY_CLOUD_NAME ||
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
  "da3qczqep";
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

/** Vrai si les identifiants d'upload (clé + secret) sont présents. */
export function cloudinaryConfigured(): boolean {
  return Boolean(API_KEY && API_SECRET);
}

/** Signe un jeu de paramètres : SHA-1 des `clé=valeur` triés + secret. */
function sign(params: Record<string, string | number>): string {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return crypto
    .createHash("sha1")
    .update(toSign + API_SECRET)
    .digest("hex");
}

/**
 * Upload signé d'un fichier vers Cloudinary (mode « upload »).
 * Renvoie l'URL sécurisée (secure_url) et le public_id.
 */
export async function uploadToCloudinary(
  file: File,
  folder = `${store.cloudinaryFolder}/produits`,
): Promise<{ src: string; publicId: string }> {
  if (!API_KEY || !API_SECRET) {
    throw new Error(
      "Cloudinary non configuré : ajoute CLOUDINARY_API_KEY et CLOUDINARY_API_SECRET.",
    );
  }
  const timestamp = Math.round(Date.now() / 1000);
  const signature = sign({ folder, timestamp });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const body = new FormData();
  body.append(
    "file",
    new Blob([bytes], { type: file.type || "image/jpeg" }),
    file.name || "upload",
  );
  body.append("api_key", API_KEY);
  body.append("timestamp", String(timestamp));
  body.append("folder", folder);
  body.append("signature", signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`,
    { method: "POST", body },
  );
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `Échec de l'upload Cloudinary (${res.status}). ${detail}`.trim(),
    );
  }
  const json = (await res.json()) as { secure_url: string; public_id: string };
  return { src: json.secure_url, publicId: json.public_id };
}

/**
 * Extrait le public_id d'une URL Cloudinary uploadée
 * (…/image/upload/v123/dossier/nom.ext → « dossier/nom »). null sinon.
 */
export function publicIdFromUrl(src: string): string | null {
  const m = src.match(
    /\/image\/upload\/(?:v\d+\/)?(.+?)\.[a-zA-Z0-9]+(?:\?.*)?$/,
  );
  return m ? m[1] : null;
}

/** Suppression best-effort d'un asset Cloudinary à partir de son URL. */
export async function destroyFromCloudinary(src: string): Promise<void> {
  if (!API_KEY || !API_SECRET) return;
  const publicId = publicIdFromUrl(src);
  if (!publicId) return;
  const timestamp = Math.round(Date.now() / 1000);
  const signature = sign({ public_id: publicId, timestamp });
  const body = new FormData();
  body.append("public_id", publicId);
  body.append("api_key", API_KEY);
  body.append("timestamp", String(timestamp));
  body.append("signature", signature);
  await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/destroy`, {
    method: "POST",
    body,
  }).catch(() => {
    /* best-effort : on ignore l'échec de suppression distante */
  });
}
