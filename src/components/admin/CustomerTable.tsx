"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { Mono } from "@/components/admin/ui";
import { initials } from "@/lib/adminData";

interface Row {
  id: string;
  name: string;
  email: string;
  orders: number;
  spent: number;
  since: string;
  hasAccount: boolean;
}

export function CustomerTable({ customers }: { customers: Row[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter((c) =>
      [c.name, c.email].join(" ").toLowerCase().includes(term),
    );
  }, [q, customers]);

  return (
    <>
      <div className="relative mb-[18px]">
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
          placeholder="Rechercher un client…"
          className="w-full text-[14px] pl-10 pr-3.5 py-[11px] rounded-[11px]"
          style={{ background: "#fff", border: "1px solid rgba(20,21,26,0.1)" }}
        />
      </div>

      <div
        className="overflow-hidden"
        style={{ background: "#fff", border: "1px solid rgba(20,21,26,0.08)", borderRadius: 15 }}
      >
        <div
          className="grid grid-cols-[1fr_80px_110px_110px] gap-3.5 px-5 py-3 text-[10.5px] tracking-[0.1em] uppercase"
          style={{
            fontFamily: "var(--font-geist-mono), monospace",
            color: "rgba(20,21,26,0.4)",
            borderBottom: "1px solid rgba(20,21,26,0.07)",
          }}
        >
          <span>Client</span>
          <span className="text-right">Payées</span>
          <span className="text-right">Dépensé</span>
          <span className="text-right">Depuis</span>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-[13.5px]" style={{ color: "rgba(20,21,26,0.5)" }}>
            Aucun client trouvé.
          </div>
        ) : (
          filtered.map((c) => (
            <Link
              key={c.id}
              href={`/admin/clients/${c.id}`}
              className="grid grid-cols-[1fr_80px_110px_110px] gap-3.5 items-center px-5 py-[13px] hover:bg-[rgba(20,21,26,0.02)] transition-colors"
              style={{ borderTop: "1px solid rgba(20,21,26,0.06)" }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0"
                  style={{ background: "rgba(20,21,26,0.06)", color: "rgba(20,21,26,0.6)" }}
                >
                  {initials(c.name)}
                </span>
                <div className="min-w-0">
                  <div className="text-[13.5px] font-medium">
                    {c.name}
                    {!c.hasAccount && (
                      <span
                        className="ml-2 text-[10.5px] px-1.5 py-0.5 rounded-full align-middle"
                        style={{ background: "rgba(20,21,26,0.06)", color: "rgba(20,21,26,0.55)" }}
                      >
                        sans compte
                      </span>
                    )}
                  </div>
                  <div className="text-[11.5px] mt-0.5 truncate" style={{ color: "rgba(20,21,26,0.42)" }}>
                    {c.email}
                  </div>
                </div>
              </div>
              <Mono className="text-[13px] text-right">{c.orders}</Mono>
              <Mono className="text-[13px] font-medium text-right">{formatPrice(c.spent)}</Mono>
              <span className="text-[12.5px] text-right" style={{ color: "rgba(20,21,26,0.5)" }}>
                {c.since}
              </span>
            </Link>
          ))
        )}
      </div>
    </>
  );
}
