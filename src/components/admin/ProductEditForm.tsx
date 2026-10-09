"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  createProductVariant,
  deleteProduct,
  deleteProductVariant,
  updateProduct,
  updateProductVariant,
} from "@/app/admin/actions";
import { ProductImages, type AdminImage } from "./ProductImages";
import { store } from "@/stores";

interface Draft {
  id: string;
  slug: string;
  name: string;
  description: string;
  sourceUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  price: string;
  stock: string;
  status: string;
  categoryId: string;
  sku: string;
  images: AdminImage[];
  variants: {
    id: string;
    label: string;
    available: boolean;
    sku?: string;
    colorName?: string;
    sizeLabel?: string;
    stock?: number;
    imageId?: string;
  }[];
}

const statusOptions = [
  { key: "active", label: "Publié" },
  { key: "review", label: "À retravailler" },
  { key: "draft", label: "Brouillon" },
  { key: "archived", label: "Épuisé" },
];

const inputStyle: React.CSSProperties = {
  background: "#FBFAF8",
  border: "1px solid rgba(20,21,26,0.1)",
  borderRadius: 10,
};

export function ProductEditForm({
  initial,
  categories,
}: {
  initial: Draft;
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(initial);
  const [toast, setToast] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [openVariantIds, setOpenVariantIds] = useState<Set<string>>(
    () => new Set(),
  );

  function set<K extends keyof Draft>(k: K, v: Draft[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  function setVariant(
    index: number,
    patch: Partial<Draft["variants"][number]>,
  ) {
    setDraft((d) => ({
      ...d,
      variants: d.variants.map((variant, i) =>
        i === index ? { ...variant, ...patch } : variant,
      ),
    }));
  }

  function syncVariantImage(variantId: string, imageId?: string) {
    setDraft((d) => ({
      ...d,
      images: d.images.map((img) => ({
        ...img,
        variantId:
          img.id === imageId
            ? variantId
            : img.variantId === variantId
              ? undefined
              : img.variantId,
      })),
      variants: d.variants.map((variant) =>
        variant.id === variantId ? { ...variant, imageId } : variant,
      ),
    }));
  }

  function toggleVariant(variantId: string) {
    setOpenVariantIds((current) => {
      const next = new Set(current);
      if (next.has(variantId)) next.delete(variantId);
      else next.add(variantId);
      return next;
    });
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await updateProduct(draft.id, {
        name: draft.name,
        slug: draft.slug,
        description: draft.description,
        seoTitle: draft.seoTitle,
        seoDescription: draft.seoDescription,
        price: draft.price,
        stock: draft.stock,
        status: draft.status,
        sku: draft.sku,
        categoryId: draft.categoryId,
      });
      if (res?.error) {
        setError(res.error);
        return;
      }
      setToast(true);
      setTimeout(() => {
        setToast(false);
        router.push("/admin/produits");
      }, 1200);
    });
  }

  function removeProduct() {
    const ok = confirm(
      `Supprimer définitivement le produit "${draft.name}" ? Cette action est irréversible.`,
    );
    if (!ok) return;

    setError(null);
    startTransition(async () => {
      const res = await deleteProduct(draft.id);
      if ("error" in res) {
        setError(res.error ?? "Impossible de supprimer le produit");
        return;
      }
      router.push("/admin/produits");
      router.refresh();
    });
  }

  return (
    <div>
      <button
        onClick={() => router.push("/admin/produits")}
        className="flex items-center gap-1.5 text-[13px] font-medium mb-[22px] cursor-pointer"
        style={{ color: "rgba(20,21,26,0.55)" }}
      >
        ‹ Produits
      </button>

      <div className="flex items-start justify-between gap-6 mb-[30px]">
        <h1 className="m-0 text-[27px] font-semibold tracking-[-0.03em]">
          {draft.name || "Nouveau produit"}
        </h1>
        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href={`/produit/${draft.slug}`}
            target="_blank"
            rel="noreferrer"
            className="text-[13px] font-medium px-3.5 py-2.5 rounded-[10px]"
            style={{
              color: "#14151A",
              border: "1px solid rgba(20,21,26,0.12)",
              background: "#fff",
            }}
            title={
              draft.status === "draft"
                ? "Le produit est en brouillon : la page publique renverra 404."
                : "Ouvrir la page produit publique"
            }
          >
            Voir public
          </a>
          <button
            onClick={() => router.push("/admin/produits")}
            className="text-[13px] font-medium px-3.5 py-2.5 rounded-[10px] cursor-pointer"
            style={{ color: "rgba(20,21,26,0.6)" }}
          >
            Annuler
          </button>
          <button
            onClick={removeProduct}
            disabled={pending}
            className="text-[13px] font-medium px-3.5 py-2.5 rounded-[10px] cursor-pointer disabled:opacity-60"
            style={{
              color: "#B23A2E",
              background: "rgba(178,58,46,0.08)",
            }}
          >
            Supprimer
          </button>
          <button
            onClick={save}
            disabled={pending}
            className="text-[13px] font-medium px-[18px] py-2.5 rounded-[10px] cursor-pointer disabled:opacity-60"
            style={{ background: "#14151A", color: "#FBFAF8" }}
          >
            {pending ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-3.5 items-start">
        {/* Colonne gauche */}
        <div className="flex flex-col gap-3.5">
          <Panel>
            <Label>Nom du produit</Label>
            <input
              value={draft.name}
              onChange={(e) => set("name", e.target.value)}
              className="w-full text-[14.5px] px-[13px] py-[11px]"
              style={inputStyle}
            />
            <Label className="mt-[18px]">Description</Label>
            <textarea
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
              rows={4}
              className="w-full text-[14px] leading-[1.55] px-[13px] py-[11px] resize-y"
              style={inputStyle}
            />
            {draft.sourceUrl && (
              <div className="mt-[18px] text-[13px]">
                <Label>Page fournisseur</Label>
                <a href={draft.sourceUrl} target="_blank" rel="noreferrer" className="break-all underline" style={{ color: "#6F5B45" }}>
                  {draft.sourceUrl}
                </a>
              </div>
            )}
          </Panel>

          <Panel>
            <ProductImages
              productId={initial.id}
              initial={initial.images}
              onImagesChange={(images) => set("images", images)}
            />
          </Panel>

          <Panel>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="text-[13.5px] font-semibold">Variantes</div>
              <div className="flex items-center gap-3">
                {draft.variants.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenVariantIds(
                          new Set(draft.variants.map((variant) => variant.id)),
                        )
                      }
                      className="text-[12px] font-medium cursor-pointer"
                      style={{ color: "rgba(20,21,26,0.5)" }}
                    >
                      Tout ouvrir
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpenVariantIds(new Set())}
                      className="text-[12px] font-medium cursor-pointer"
                      style={{ color: "rgba(20,21,26,0.5)" }}
                    >
                      Tout fermer
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    startTransition(async () => {
                      const res = await createProductVariant(initial.id, {
                        label: "Nouvelle variante",
                        available: true,
                        stock: "0",
                      });
                      if ("error" in res || !res.id) {
                        setError(
                          "error" in res
                            ? (res.error ?? "Impossible de créer la variante")
                            : "Impossible de créer la variante",
                        );
                        return;
                      }
                      setDraft((d) => ({
                        ...d,
                        variants: [
                          ...d.variants,
                          {
                            id: res.id,
                            label: "Nouvelle variante",
                            available: true,
                            stock: 0,
                          },
                        ],
                      }));
                      setOpenVariantIds((current) => new Set(current).add(res.id));
                      router.refresh();
                    });
                  }}
                  disabled={pending}
                  className="text-[12.5px] font-medium cursor-pointer disabled:opacity-50"
                  style={{ color: "#1a5bff" }}
                >
                  + Ajouter
                </button>
              </div>
            </div>
            {draft.variants.length === 0 ? (
              <div className="text-[13px] py-2" style={{ color: "rgba(20,21,26,0.45)" }}>
                Pièce unique, sans variante.
              </div>
            ) : (
              draft.variants.map((v, i) => {
                const isOpen = openVariantIds.has(v.id);
                const image = draft.images.find((img) => img.id === v.imageId);
                const imageIndex = image
                  ? draft.images.findIndex((img) => img.id === image.id) + 1
                  : null;

                return (
                  <div
                    key={v.id}
                    className="py-2.5"
                    style={{ borderTop: "1px solid rgba(20,21,26,0.06)" }}
                  >
                    <div className="grid grid-cols-[52px_1fr_auto] gap-3 items-center">
                      <button
                        type="button"
                        onClick={() => toggleVariant(v.id)}
                        className="relative h-[58px] rounded-lg overflow-hidden cursor-pointer"
                        style={{
                          background: "#FBFAF8",
                          border: "1px solid rgba(20,21,26,0.08)",
                        }}
                        aria-label={`${isOpen ? "Fermer" : "Ouvrir"} ${v.label}`}
                      >
                        {image ? (
                          <Image
                            src={image.src}
                            alt={image.alt}
                            fill
                            sizes="52px"
                            style={{ objectFit: "cover" }}
                          />
                        ) : (
                          <span
                            className="absolute inset-0 flex items-center justify-center text-[9px] text-center px-1"
                            style={{ color: "rgba(20,21,26,0.38)" }}
                          >
                            Image générale
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleVariant(v.id)}
                        className="min-w-0 text-left cursor-pointer"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[14px] font-semibold text-ink">
                            {v.label || "Variante sans nom"}
                          </span>
                          <span
                            className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                            style={{
                              background: v.available
                                ? "rgba(30,125,82,0.08)"
                                : "rgba(178,58,46,0.08)",
                              color: v.available ? "#1E7D52" : "#B23A2E",
                            }}
                          >
                            {v.available ? "Disponible" : "Épuisée"}
                          </span>
                        </div>
                        <div
                          className="text-[11.5px] mt-1 truncate"
                          style={{
                            fontFamily: "var(--font-geist-mono), monospace",
                            color: "rgba(20,21,26,0.42)",
                          }}
                        >
                          {[v.colorName, v.sizeLabel, v.sku].filter(Boolean).join(" · ") ||
                            "Aucune info variante"}
                        </div>
                        <div
                          className="text-[11.5px] mt-0.5"
                          style={{ color: "rgba(20,21,26,0.42)" }}
                        >
                          Stock {v.stock ?? 0}
                          {imageIndex ? ` · Photo ${imageIndex}` : " · Image générale"}
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleVariant(v.id)}
                        className="text-[12px] font-medium px-3 py-2 rounded-lg cursor-pointer"
                        style={{
                          background: isOpen ? "#14151A" : "rgba(20,21,26,0.05)",
                          color: isOpen ? "#FBFAF8" : "rgba(20,21,26,0.65)",
                        }}
                      >
                        {isOpen ? "Fermer" : "Ouvrir"}
                      </button>
                    </div>

                    {isOpen && (
                      <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-3.5 mt-4 pb-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 min-w-0">
                          <VariantImageSelect
                            images={draft.images}
                            value={v.imageId}
                            onChange={(imageId) => setVariant(i, { imageId })}
                          />
                          <Field
                            label="Nom affiché"
                            value={v.label}
                            onChange={(value) => setVariant(i, { label: value })}
                          />
                          <Field
                            label="Couleur"
                            value={v.colorName ?? ""}
                            onChange={(value) => setVariant(i, { colorName: value })}
                          />
                          <Field
                            label="Taille"
                            value={v.sizeLabel ?? ""}
                            onChange={(value) => setVariant(i, { sizeLabel: value })}
                          />
                          <Field
                            label="SKU variante"
                            value={v.sku ?? ""}
                            mono
                            onChange={(value) => setVariant(i, { sku: value })}
                          />
                          <Field
                            label="Stock"
                            value={String(v.stock ?? 0)}
                            inputMode="numeric"
                            mono
                            onChange={(value) =>
                              setVariant(i, { stock: Number(value) || 0 })
                            }
                          />
                          <label className="flex items-center gap-2 text-[12.5px] pt-6">
                            <input
                              type="checkbox"
                              checked={v.available}
                              onChange={(event) =>
                                setVariant(i, { available: event.target.checked })
                              }
                            />
                            Disponible
                          </label>
                        </div>

                        <div className="flex xl:flex-col gap-2 xl:items-stretch">
                          <button
                            type="button"
                            onClick={() => {
                              setError(null);
                              startTransition(async () => {
                                const res = await updateProductVariant(v.id, {
                                  label: v.label,
                                  sku: v.sku,
                                  colorName: v.colorName,
                                  sizeLabel: v.sizeLabel,
                                  stock: String(v.stock ?? 0),
                                  available: v.available,
                                  imageId: v.imageId,
                                });
                                if ("error" in res) {
                                  setError(res.error ?? "Impossible d'enregistrer");
                                  return;
                                }
                                syncVariantImage(v.id, v.imageId);
                                toggleVariant(v.id);
                              });
                            }}
                            disabled={pending}
                            className="text-[12px] font-medium px-3 py-2 rounded-lg cursor-pointer disabled:opacity-50"
                            style={{ background: "#14151A", color: "#FBFAF8" }}
                          >
                            Enregistrer
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!confirm("Supprimer cette variante ?")) return;
                              setError(null);
                              startTransition(async () => {
                                const res = await deleteProductVariant(v.id);
                                if (res?.error) {
                                  setError(res.error);
                                  return;
                                }
                                setDraft((d) => ({
                                  ...d,
                                  variants: d.variants.filter(
                                    (variant) => variant.id !== v.id,
                                  ),
                                  images: d.images.map((img) =>
                                    img.variantId === v.id
                                      ? { ...img, variantId: undefined }
                                      : img,
                                  ),
                                }));
                                setOpenVariantIds((current) => {
                                  const next = new Set(current);
                                  next.delete(v.id);
                                  return next;
                                });
                                router.refresh();
                              });
                            }}
                            disabled={pending}
                            className="text-[12px] font-medium px-3 py-2 rounded-lg cursor-pointer disabled:opacity-50"
                            style={{
                              background: "rgba(178,58,46,0.08)",
                              color: "#B23A2E",
                            }}
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </Panel>

          <Panel>
            <SeoEditor
              slug={draft.slug}
              title={draft.seoTitle ?? ""}
              description={draft.seoDescription ?? ""}
              fallbackTitle={draft.name}
              fallbackDescription={draft.description}
              onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
            />
          </Panel>
        </div>

        {/* Colonne droite */}
        <div className="flex flex-col gap-3.5">
          <Panel>
            <Label>Statut</Label>
            <div
              className="flex gap-1.5 p-1"
              style={{ background: "#FBFAF8", border: "1px solid rgba(20,21,26,0.1)", borderRadius: 10 }}
            >
              {statusOptions.map((s) => {
                const active = draft.status === s.key;
                return (
                  <button
                    key={s.key}
                    onClick={() => set("status", s.key)}
                    className="flex-1 text-[12.5px] font-medium py-[7px] rounded-[7px] transition-all cursor-pointer"
                    style={{
                      background: active ? "#14151A" : "transparent",
                      color: active ? "#FBFAF8" : "rgba(20,21,26,0.6)",
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </Panel>

          <Panel>
            <Label>Prix</Label>
            <div className="relative mb-[18px]">
              <span
                className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[14px]"
                style={{ fontFamily: "var(--font-geist-mono), monospace", color: "rgba(20,21,26,0.4)" }}
              >
                €
              </span>
              <input
                value={draft.price}
                onChange={(e) => set("price", e.target.value)}
                inputMode="decimal"
                className="w-full text-[14px] pl-[30px] pr-[13px] py-[11px]"
                style={{ ...inputStyle, fontFamily: "var(--font-geist-mono), monospace" }}
              />
            </div>
            <Label>Stock total</Label>
            <input
              value={draft.stock}
              onChange={(e) => set("stock", e.target.value)}
              inputMode="numeric"
              className="w-full text-[14px] px-[13px] py-[11px]"
              style={{ ...inputStyle, fontFamily: "var(--font-geist-mono), monospace" }}
            />
          </Panel>

          <Panel>
            <Label>Catégorie</Label>
            <select
              value={draft.categoryId}
              onChange={(e) => set("categoryId", e.target.value)}
              className="w-full text-[14px] px-[13px] py-[11px]"
              style={inputStyle}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Label className="mt-[18px]">Référence (SKU)</Label>
            <input
              value={draft.sku}
              onChange={(e) => set("sku", e.target.value)}
              className="w-full text-[13px] px-[13px] py-[11px]"
              style={{ ...inputStyle, fontFamily: "var(--font-geist-mono), monospace" }}
            />
          </Panel>
        </div>
      </div>

      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-[18px] py-3 rounded-xl text-[13.5px] font-medium"
          style={{ background: "#14151A", color: "#FBFAF8", boxShadow: "0 12px 32px rgba(0,0,0,0.18)" }}
        >
          <span style={{ color: "#7fffc4" }}>✓</span>
          Produit enregistré
        </div>
      )}
      {error && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-[18px] py-3 rounded-xl text-[13.5px] font-medium"
          style={{ background: "#B23A2E", color: "#fff" }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

function VariantImageSelect({
  images,
  value,
  onChange,
}: {
  images: AdminImage[];
  value?: string;
  onChange: (imageId?: string) => void;
}) {
  const selected = images.find((img) => img.id === value);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draftImageId, setDraftImageId] = useState<string | undefined>(value);
  const draftImage = images.find((img) => img.id === draftImageId);
  const selectedIndex = selected
    ? images.findIndex((img) => img.id === selected.id) + 1
    : null;
  const draftIndex = draftImage
    ? images.findIndex((img) => img.id === draftImage.id) + 1
    : null;

  function openPicker() {
    setDraftImageId(value);
    setPickerOpen(true);
  }

  return (
    <div className="xl:col-span-3">
      <div
        className="grid grid-cols-[76px_1fr_auto] gap-3 items-center rounded-xl p-3"
        style={{
          background: "#FBFAF8",
          border: "1px solid rgba(20,21,26,0.08)",
        }}
      >
        <div
          className="relative overflow-hidden shrink-0"
          style={{
            width: 76,
            height: 88,
            borderRadius: 10,
            background: "#fff",
            border: "1px solid rgba(20,21,26,0.08)",
          }}
        >
          {selected ? (
            <Image
              src={selected.src}
              alt={selected.alt}
              fill
              sizes="76px"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <span
              className="absolute inset-0 flex items-center justify-center text-[10px] text-center px-2"
              style={{ color: "rgba(20,21,26,0.38)" }}
            >
              Image générale
            </span>
          )}
        </div>
        <div className="min-w-0">
          <div
            className="text-[11.5px] font-medium"
            style={{ color: "rgba(20,21,26,0.48)" }}
          >
            Photo de la variante
          </div>
          <div
            className="text-[14px] font-semibold mt-0.5"
            style={{ color: "#14151A" }}
          >
            {selectedIndex ? `Photo ${selectedIndex}` : "Image générale"}
          </div>
          <div
            className="text-[12px] mt-1 truncate"
            style={{ color: "rgba(20,21,26,0.45)" }}
          >
            {selected?.alt || "Utilise la couverture du produit"}
          </div>
        </div>
        <button
          type="button"
          onClick={openPicker}
          disabled={images.length === 0}
          className="text-[12px] font-medium px-3 py-2 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: "#14151A",
            color: "#FBFAF8",
          }}
        >
          Choisir
        </button>
      </div>

      {pickerOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-5"
          style={{ background: "rgba(20,21,26,0.78)" }}
          onClick={() => setPickerOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Choisir la photo de variante"
        >
          <div
            className="w-full max-w-[1040px] rounded-2xl overflow-hidden"
            style={{
              background: "#fff",
              boxShadow: "0 24px 80px rgba(0,0,0,0.34)",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="flex items-center justify-between gap-4 px-5 py-4"
              style={{ borderBottom: "1px solid rgba(20,21,26,0.08)" }}
            >
              <div>
                <div className="text-[15px] font-semibold">
                  Choisir la photo de la variante
                </div>
                <div
                  className="text-[12px] mt-0.5"
                  style={{ color: "rgba(20,21,26,0.48)" }}
                >
                  Clique une photo pour la prévisualiser, puis valide.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="h-9 w-9 rounded-full text-[20px] leading-none cursor-pointer"
                style={{ background: "#FBFAF8", color: "#14151A" }}
                aria-label="Fermer"
              >
                x
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-0">
              <div className="p-5">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  <button
                    type="button"
                    onClick={() => setDraftImageId(undefined)}
                    className="min-h-[126px] rounded-xl cursor-pointer text-[13px] font-medium px-2"
                    style={{
                      background: "#FBFAF8",
                      border:
                        !draftImageId
                          ? "2px solid #14151A"
                          : "1px solid rgba(20,21,26,0.1)",
                      color: "rgba(20,21,26,0.6)",
                    }}
                  >
                    Image générale
                  </button>
                  {images.map((image, index) => {
                    const active = image.id === draftImageId;
                    return (
                      <button
                        key={image.id}
                        type="button"
                        onClick={() => setDraftImageId(image.id)}
                        className="group relative aspect-[4/5] rounded-xl overflow-hidden cursor-pointer"
                        style={{
                          background: "#FBFAF8",
                          border: active
                            ? "2px solid #14151A"
                            : "1px solid rgba(20,21,26,0.1)",
                          boxShadow: active
                            ? "0 0 0 3px rgba(20,21,26,0.08)"
                            : "none",
                        }}
                        aria-label={`Prévisualiser la photo ${index + 1}`}
                      >
                        <Image
                          src={image.src}
                          alt={image.alt}
                          fill
                          sizes="180px"
                          style={{ objectFit: "cover" }}
                        />
                        <span
                          className="absolute left-2 bottom-2 rounded-md px-2 py-1 text-[11px] font-semibold"
                          style={{
                            background: "rgba(255,255,255,0.92)",
                            color: "#14151A",
                          }}
                        >
                          Photo {index + 1}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div
                className="p-5 flex flex-col"
                style={{
                  background: "#FBFAF8",
                  borderLeft: "1px solid rgba(20,21,26,0.08)",
                }}
              >
                <div className="text-[12px] font-medium mb-2" style={{ color: "rgba(20,21,26,0.48)" }}>
                  Aperçu sélectionné
                </div>
                <div
                  className="relative rounded-xl overflow-hidden mb-3"
                  style={{
                    aspectRatio: "4 / 5",
                    background: "#fff",
                    border: "1px solid rgba(20,21,26,0.08)",
                  }}
                >
                  {draftImage ? (
                    <Image
                      src={draftImage.src}
                      alt={draftImage.alt}
                      fill
                      sizes="360px"
                      style={{ objectFit: "contain" }}
                    />
                  ) : (
                    <span
                      className="absolute inset-0 flex items-center justify-center text-[13px]"
                      style={{ color: "rgba(20,21,26,0.42)" }}
                    >
                      Image générale du produit
                    </span>
                  )}
                </div>
                <div className="text-[14px] font-semibold">
                  {draftIndex ? `Photo ${draftIndex}` : "Image générale"}
                </div>
                <div
                  className="text-[12px] leading-[1.45] mt-1 mb-5"
                  style={{ color: "rgba(20,21,26,0.48)" }}
                >
                  {draftImage?.alt ||
                    "La variante utilisera la photo principale du produit."}
                </div>

                <div className="mt-auto flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onChange(draftImageId);
                      setPickerOpen(false);
                    }}
                    className="flex-1 text-[13px] font-medium px-4 py-3 rounded-lg cursor-pointer"
                    style={{ background: "#14151A", color: "#FBFAF8" }}
                  >
                    Utiliser cette photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickerOpen(false)}
                    className="text-[13px] font-medium px-4 py-3 rounded-lg cursor-pointer"
                    style={{
                      background: "#fff",
                      color: "rgba(20,21,26,0.64)",
                      border: "1px solid rgba(20,21,26,0.08)",
                    }}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SeoEditor({
  slug,
  title,
  description,
  fallbackTitle,
  fallbackDescription,
  onChange,
}: {
  slug: string;
  title: string;
  description: string;
  fallbackTitle: string;
  fallbackDescription: string;
  onChange: (patch: Partial<Draft>) => void;
}) {
  const previewTitle = title.trim() || fallbackTitle;
  const previewDescription =
    description.trim() || fallbackDescription.replace(/\s+/g, " ").slice(0, 160);
  const previewUrl = `https://${store.domains.primary}/produit/${slug || "slug-produit"}`;

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="text-[13.5px] font-semibold">SEO Google</div>
          <p
            className="text-[12px] mt-1"
            style={{ color: "rgba(20,21,26,0.45)" }}
          >
            Modifie l&apos;URL et les metas affichées dans les résultats Google.
          </p>
        </div>
        <span
          className="text-[11px] font-medium px-2 py-1 rounded-md"
          style={{ background: "rgba(26,91,255,0.08)", color: "#1a5bff" }}
        >
          Preview
        </span>
      </div>

      <div
        className="mb-5 p-4 rounded-xl"
        style={{
          background: "#FBFAF8",
          border: "1px solid rgba(20,21,26,0.08)",
        }}
      >
        <div className="text-[12px] truncate" style={{ color: "#188038" }}>
          {previewUrl}
        </div>
        <div className="text-[18px] leading-snug mt-1" style={{ color: "#1a0dab" }}>
          {previewTitle}
        </div>
        <div className="text-[13px] leading-[1.45] mt-1" style={{ color: "#4d5156" }}>
          {previewDescription}
        </div>
      </div>

      <Label>Slug URL</Label>
      <div className="grid grid-cols-[auto_1fr] items-center mb-[18px]">
        <span
          className="text-[12.5px] px-3 py-[11px]"
          style={{
            background: "#F4F1EC",
            border: "1px solid rgba(20,21,26,0.1)",
            borderRight: 0,
            borderRadius: "10px 0 0 10px",
            color: "rgba(20,21,26,0.45)",
          }}
        >
          /produit/
        </span>
        <input
          value={slug}
          onChange={(event) => onChange({ slug: event.target.value })}
          className="w-full text-[13px] px-[13px] py-[11px]"
          style={{
            ...inputStyle,
            borderRadius: "0 10px 10px 0",
            fontFamily: "var(--font-geist-mono), monospace",
          }}
        />
      </div>

      <Label>Meta title</Label>
      <input
        value={title}
        onChange={(event) => onChange({ seoTitle: event.target.value })}
        placeholder={fallbackTitle}
        className="w-full text-[14px] px-[13px] py-[11px]"
        style={inputStyle}
      />
      <div
        className="text-[11.5px] mt-1.5 mb-[18px]"
        style={{ color: title.length > 65 ? "#B23A2E" : "rgba(20,21,26,0.42)" }}
      >
        {title.length || fallbackTitle.length}/60 recommandé
      </div>

      <Label>Meta description</Label>
      <textarea
        value={description}
        onChange={(event) => onChange({ seoDescription: event.target.value })}
        placeholder={fallbackDescription.replace(/\s+/g, " ").slice(0, 160)}
        rows={3}
        className="w-full text-[13px] leading-[1.5] px-[13px] py-[11px] resize-y"
        style={inputStyle}
      />
      <div
        className="text-[11.5px] mt-1.5"
        style={{
          color:
            description.length > 160 ? "#B23A2E" : "rgba(20,21,26,0.42)",
        }}
      >
        {description.length || previewDescription.length}/155 recommandé
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  mono = false,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  mono?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label className="block">
      <span
        className="block text-[11.5px] font-medium mb-1.5"
        style={{ color: "rgba(20,21,26,0.48)" }}
      >
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode={inputMode}
        className="w-full text-[12.5px] px-2.5 py-2"
        style={{
          ...inputStyle,
          fontFamily: mono ? "var(--font-geist-mono), monospace" : undefined,
        }}
      />
    </label>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="px-6 py-[22px]"
      style={{ background: "#fff", border: "1px solid rgba(20,21,26,0.08)", borderRadius: 15 }}
    >
      {children}
    </div>
  );
}

function Label({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label
      className={`block text-[12.5px] font-medium mb-2 ${className}`}
      style={{ color: "rgba(20,21,26,0.6)" }}
    >
      {children}
    </label>
  );
}
