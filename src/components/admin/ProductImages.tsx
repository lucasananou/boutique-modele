"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import {
  deleteProductImage,
  setCoverImage,
  reorderProductImages,
} from "@/app/admin/actions";

export interface AdminImage {
  id: string;
  src: string;
  alt: string;
  variantId?: string;
}

/**
 * Gestion des images d'un produit (admin) : upload multi-fichiers vers
 * Cloudinary (via /api/admin/produits/[id]/images), définition de la
 * couverture et suppression. Les changements sont persistés immédiatement.
 */
export function ProductImages({
  productId,
  initial,
  onImagesChange,
}: {
  productId: string;
  initial: AdminImage[];
  onImagesChange?: (images: AdminImage[]) => void;
}) {
  const [images, setImages] = useState<AdminImage[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [preview, setPreview] = useState<AdminImage | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!preview) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setPreview(null);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [preview]);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    setBusy(true);
    try {
      const fd = new FormData();
      for (const f of Array.from(fileList)) fd.append("file", f);
      const res = await fetch(`/api/admin/produits/${productId}/images`, {
        method: "POST",
        body: fd,
      });
      const json = (await res.json().catch(() => ({}))) as {
        images?: AdminImage[];
        error?: string;
      };
      if (json.images?.length) {
        setImages((prev) => {
          const next = [...prev, ...json.images!];
          onImagesChange?.(next);
          return next;
        });
      }
      if (!res.ok) setError(json.error || "Échec de l'upload.");
    } catch {
      setError("Échec de l'upload (réseau).");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await deleteProductImage(id);
      if (res?.error) setError(res.error);
      else {
        setImages((prev) => {
          const next = prev.filter((i) => i.id !== id);
          onImagesChange?.(next);
          return next;
        });
      }
    });
  }

  function makeCover(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await setCoverImage(id);
      if (res?.error) {
        setError(res.error);
        return;
      }
      setImages((prev) => {
        const target = prev.find((i) => i.id === id);
        if (!target) return prev;
        const next = [target, ...prev.filter((i) => i.id !== id)];
        onImagesChange?.(next);
        return next;
      });
    });
  }

  /** Déplace l'image glissée à la position de la cible, puis persiste l'ordre. */
  function handleDrop(toId: string) {
    const fromId = dragId;
    setDragId(null);
    setOverId(null);
    if (!fromId || fromId === toId) return;
    const from = images.findIndex((i) => i.id === fromId);
    const to = images.findIndex((i) => i.id === toId);
    if (from === -1 || to === -1) return;

    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setImages(next); // optimiste
    onImagesChange?.(next);
    setError(null);

    const ids = next.map((i) => i.id);
    startTransition(async () => {
      const res = await reorderProductImages(productId, ids);
      if (res?.error) setError(res.error);
    });
  }

  const locked = busy || pending;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-[13.5px] font-semibold">Images</div>
        <span className="text-[12px]" style={{ color: "rgba(20,21,26,0.4)" }}>
          Enregistrées immédiatement
        </span>
      </div>

      <div className="grid grid-cols-4 gap-[11px]">
        {images.map((img, i) => (
          <div
            key={img.id}
            draggable
            onDragStart={(e) => {
              setDragId(img.id);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (overId !== img.id) setOverId(img.id);
            }}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(img.id);
            }}
            onDragEnd={() => {
              setDragId(null);
              setOverId(null);
            }}
            onClick={() => {
              if (!dragId) setPreview(img);
            }}
            className="group relative cursor-grab active:cursor-grabbing"
            style={{
              aspectRatio: "1",
              borderRadius: 11,
              overflow: "hidden",
              border: "1px solid rgba(20,21,26,0.08)",
              background: "#FBFAF8",
              opacity: dragId === img.id ? 0.4 : 1,
              boxShadow:
                overId === img.id && dragId !== img.id
                  ? "0 0 0 2px #14151A"
                  : "none",
              transition: "opacity 0.15s, box-shadow 0.15s",
            }}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes="140px"
              style={{ objectFit: "cover" }}
            />

            {i === 0 && (
              <span
                className="absolute top-1.5 left-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                style={{ background: "#14151A", color: "#FBFAF8" }}
              >
                Couverture
              </span>
            )}

            {img.variantId && (
              <span
                className="absolute top-1.5 right-1.5 max-w-[78%] truncate text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                style={{ background: "#fff", color: "#14151A" }}
                title="Image de variation"
              >
                Variation
              </span>
            )}

            {/* Actions au survol */}
            <div
              className="absolute inset-0 flex items-end justify-center gap-1.5 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                background:
                  "linear-gradient(to top, rgba(20,21,26,0.55), rgba(20,21,26,0) 55%)",
              }}
            >
              {i !== 0 && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    makeCover(img.id);
                  }}
                  disabled={locked}
                  className="text-[11px] font-medium px-2 py-1 rounded-md cursor-pointer disabled:opacity-50"
                  style={{ background: "#fff", color: "#14151A" }}
                  title="Définir comme couverture"
                >
                  Couverture
                </button>
              )}
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  remove(img.id);
                }}
                disabled={locked}
                className="text-[11px] font-medium px-2 py-1 rounded-md cursor-pointer disabled:opacity-50"
                style={{ background: "#B23A2E", color: "#fff" }}
                title="Supprimer"
              >
                Suppr.
              </button>
            </div>
          </div>
        ))}

        {/* Tuile d'ajout */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={locked}
          className="flex flex-col items-center justify-center gap-1 cursor-pointer disabled:cursor-wait"
          style={{
            aspectRatio: "1",
            borderRadius: 11,
            border: "1.5px dashed rgba(20,21,26,0.16)",
            color: "rgba(20,21,26,0.4)",
            background: "#FBFAF8",
          }}
        >
          {busy ? (
            <span className="text-[11px] font-medium">Envoi…</span>
          ) : (
            <>
              <span className="text-[20px] leading-none">+</span>
              <span className="text-[11px] font-medium">Ajouter</span>
            </>
          )}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />

      <p className="text-[12px] mt-3" style={{ color: "rgba(20,21,26,0.45)" }}>
        Glisse-dépose les vignettes pour les réordonner — la 1re est la
        couverture. Ajoute plusieurs fichiers d&apos;un coup ; formats image,
        10 Mo max.
      </p>

      {error && (
        <p
          className="text-[12.5px] font-medium mt-2 px-3 py-2 rounded-lg"
          style={{ background: "rgba(178,58,46,0.08)", color: "#B23A2E" }}
        >
          {error}
        </p>
      )}

      {preview && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-5"
          style={{ background: "rgba(20,21,26,0.82)" }}
          onClick={() => setPreview(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Apercu de l'image produit"
        >
          <div
            className="relative w-full max-w-[min(980px,92vw)]"
            style={{ height: "min(86vh, 980px)" }}
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={preview.src}
              alt={preview.alt}
              fill
              sizes="92vw"
              style={{ objectFit: "contain" }}
              priority
            />
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="absolute right-0 top-0 translate-x-1/2 -translate-y-1/2 h-9 w-9 rounded-full text-[20px] leading-none cursor-pointer"
              style={{
                background: "#fff",
                color: "#14151A",
                boxShadow: "0 12px 32px rgba(0,0,0,0.24)",
              }}
              aria-label="Fermer l'apercu"
            >
              x
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
