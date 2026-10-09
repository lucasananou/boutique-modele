"use client";

import { useState, useTransition } from "react";
import { relanceCart } from "@/app/admin/actions";

/**
 * Bouton « Relancer » d'une ligne panier abandonné. Déclenche la server action
 * `relanceCart` (envoie la prochaine relance due) et affiche l'état.
 */
export function RelanceButton({
  orderId,
  disabled,
}: {
  orderId: string;
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (disabled) {
    return (
      <span
        className="text-[11.5px]"
        style={{ color: "rgb(var(--ad-ink-rgb) / 0.35)" }}
      >
        —
      </span>
    );
  }

  function onClick() {
    setMsg(null);
    startTransition(async () => {
      const res = await relanceCart(orderId);
      if (res?.error) {
        setMsg(res.error);
        return;
      }
      setDone(true);
      setMsg(`Relance ${res?.step ?? ""} envoyée`.trim());
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={pending || done}
        className="text-[11.5px] font-medium px-2.5 py-[5px] rounded-full transition-colors disabled:opacity-55"
        style={{
          border: "1px solid var(--ad-border)",
          background: "var(--ad-surface)",
          color: "rgb(var(--ad-ink-rgb) / 0.8)",
        }}
      >
        {pending ? "Envoi…" : done ? "Envoyé" : "Relancer"}
      </button>
      {msg && (
        <span
          className="text-[11px]"
          style={{ color: "rgb(var(--ad-ink-rgb) / 0.5)" }}
        >
          {msg}
        </span>
      )}
    </span>
  );
}
