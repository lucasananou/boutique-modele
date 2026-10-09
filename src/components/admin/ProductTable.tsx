"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { productStatusMeta } from "@/lib/adminStatus";
import { StatusPill, Mono, Swatch } from "@/components/admin/ui";

interface Row {
  id: string;
  name: string;
  sku: string;
  price: number;
  category: string;
  status: string;
  stock: number;
  inStock: boolean;
  image: { src: string; alt: string };
}

const statusFilters = [
  { key: "all", label: "Tous" },
  { key: "review", label: "À retravailler" },
  { key: "draft", label: "Brouillons" },
  { key: "active", label: "Publiés" },
  { key: "archived", label: "Épuisés" },
] as const;

type StatusFilter = (typeof statusFilters)[number]["key"];

export function ProductTable({ products }: { products: Row[] }) {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const statusCounts = useMemo(() => {
    return products.reduce<Record<string, number>>(
      (acc, product) => {
        acc.all += 1;
        acc[product.status] = (acc[product.status] ?? 0) + 1;
        return acc;
      },
      { all: 0 },
    );
  }, [products]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return products.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (!term) return true;
      return [p.name, p.sku, p.category]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [q, products, statusFilter]);

  return (
    <>
      <div className="mb-[18px] flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => {
            const active = statusFilter === filter.key;
            const count = statusCounts[filter.key] ?? 0;
            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => setStatusFilter(filter.key)}
                className="rounded-full px-3.5 py-2 text-[12.5px] font-medium transition-colors cursor-pointer"
                style={{
                  background: active ? "#14151A" : "#fff",
                  color: active ? "#FBFAF8" : "rgba(20,21,26,0.68)",
                  border: `1px solid ${active ? "#14151A" : "rgba(20,21,26,0.1)"}`,
                }}
              >
                {filter.label}
                <span
                  className="ml-2"
                  style={{ color: active ? "rgba(251,250,248,0.68)" : "rgba(20,21,26,0.38)" }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(20,21,26,0.4)"
          strokeWidth="1.7"
          strokeLinecap="round"
          className="absolute left-3.5 top-1/2 -translate-y-1/2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.2-3.2" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un produit…"
          className="w-full text-[14px] pl-10 pr-3.5 py-[11px] rounded-[11px]"
          style={{ background: "#fff", border: "1px solid rgba(20,21,26,0.1)" }}
        />
        </div>
      </div>

      <div
        className="overflow-hidden"
        style={{ background: "#fff", border: "1px solid rgba(20,21,26,0.08)", borderRadius: 15 }}
      >
        <div
          className="grid grid-cols-[1fr_110px_90px_110px_24px] gap-3.5 px-5 py-3 text-[10.5px] tracking-[0.1em] uppercase"
          style={{
            fontFamily: "var(--font-geist-mono), monospace",
            color: "rgba(20,21,26,0.4)",
            borderBottom: "1px solid rgba(20,21,26,0.07)",
          }}
        >
          <span>Produit</span>
          <span>Prix</span>
          <span>Stock</span>
          <span>Statut</span>
          <span />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-[15px] font-medium">Aucun produit trouvé</div>
            <div className="text-[13.5px] mt-1.5" style={{ color: "rgba(20,21,26,0.5)" }}>
              Essayez un autre terme de recherche.
            </div>
          </div>
        ) : (
          filtered.map((p) => {
            const m =
              productStatusMeta[p.status as keyof typeof productStatusMeta] ??
              productStatusMeta.active;
            return (
              <Link
                key={p.id}
                href={`/admin/produits/${p.id}`}
                className="grid grid-cols-[1fr_110px_90px_110px_24px] gap-3.5 items-center px-5 py-[13px] hover:bg-[rgba(20,21,26,0.02)] transition-colors"
                style={{ borderTop: "1px solid rgba(20,21,26,0.06)" }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {p.image.src ? (
                    <div
                      className="relative shrink-0 overflow-hidden"
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 9,
                        background: "#FBFAF8",
                        border: "1px solid rgba(20,21,26,0.08)",
                      }}
                    >
                      <Image
                        src={p.image.src}
                        alt={p.image.alt}
                        fill
                        sizes="38px"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  ) : (
                    <Swatch seed={p.id} size={38} radius={9} />
                  )}
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-medium truncate">{p.name}</div>
                    <Mono
                      className="text-[11px] mt-0.5 block"
                      style={{ color: "rgba(20,21,26,0.42)" }}
                    >
                      {p.sku} · {p.category}
                    </Mono>
                  </div>
                </div>
                <Mono className="text-[13px] font-medium">{formatPrice(p.price)}</Mono>
                <span
                  className="text-[13px]"
                  style={{ color: p.inStock ? "rgba(20,21,26,0.7)" : "#B23A2E" }}
                >
                  {p.inStock ? `${p.stock} u.` : "Épuisé"}
                </span>
                <span>
                  <StatusPill label={m.label} bg={m.bg} fg={m.fg} />
                </span>
                <span style={{ color: "rgba(20,21,26,0.3)" }}>›</span>
              </Link>
            );
          })
        )}
      </div>
    </>
  );
}
