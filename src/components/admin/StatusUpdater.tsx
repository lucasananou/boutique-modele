"use client";

import { useState, useTransition } from "react";
import { updateOrderStatus } from "@/app/admin/actions";
import { statusMeta, statusTransitions } from "@/lib/adminStatus";

export function StatusUpdater({
  orderId,
  current,
}: {
  orderId: string;
  current: string;
}) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function setStatus(status: string) {
    setSaved(false);
    startTransition(async () => {
      await updateOrderStatus(orderId, status);
      setSaved(true);
      setTimeout(() => setSaved(false), 2400);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {statusTransitions.map((s) => {
        const m = statusMeta(s);
        const active = current === s;
        return (
          <button
            key={s}
            disabled={pending || active}
            onClick={() => setStatus(s)}
            className="w-full text-[13px] font-medium py-2.5 rounded-[10px] transition-all disabled:opacity-100 cursor-pointer disabled:cursor-default"
            style={{
              background: active ? "#14151A" : "#fff",
              color: active ? "#FBFAF8" : "rgba(20,21,26,0.7)",
              border: `1px solid ${active ? "#14151A" : "rgba(20,21,26,0.12)"}`,
            }}
          >
            {active ? `✓ ${m.label}` : `Marquer « ${m.label} »`}
          </button>
        );
      })}
      {current !== "REFUNDED" && (
        <p className="text-[11.5px] m-0 mt-1" style={{ color: "rgba(20,21,26,0.45)" }}>
          « Remboursée » ne fait que changer le statut : le remboursement se fait dans Stripe.
        </p>
      )}
      {saved && (
        <div className="text-[12px] font-medium mt-1" style={{ color: "#1F7A52" }}>
          Statut mis à jour
        </div>
      )}
    </div>
  );
}
