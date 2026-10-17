"use client";

import { useState, useTransition } from "react";
import { markOrderForwarded, unmarkOrderForwarded } from "@/app/admin/expeditions/actions";

const inputStyle: React.CSSProperties = {
  background: "#FBFAF8",
  border: "1px solid rgba(20,21,26,0.1)",
  borderRadius: 10,
};

/** Bouton « copier » : texte prêt à coller dans le tableau de bord du fournisseur. */
export function CopyButton({ text, label = "Copier" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          // Repli : sélection manuelle (navigateur sans presse-papiers).
          window.prompt("Copier :", text);
        }
        setDone(true);
        setTimeout(() => setDone(false), 1600);
      }}
      className="text-[12px] font-medium px-2.5 py-1 rounded-[8px] cursor-pointer whitespace-nowrap"
      style={{ background: done ? "rgba(31,138,91,0.13)" : "rgba(20,21,26,0.06)", color: done ? "#1F7A52" : "rgba(20,21,26,0.7)" }}
    >
      {done ? "Copié" : label}
    </button>
  );
}

/** Marquage « transmise au fournisseur », avec sa référence de commande. */
export function ForwardForm({
  orderId,
  forwarded,
  partner,
}: {
  orderId: string;
  forwarded: boolean;
  partner: string;
}) {
  const [ref, setRef] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (forwarded) {
    return (
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => void (await unmarkOrderForwarded(orderId)))}
        className="text-[12px] py-1.5 cursor-pointer"
        style={{ background: "transparent", color: "rgba(20,21,26,0.5)" }}
      >
        Annuler « transmise »
      </button>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[12px]" style={{ color: "rgba(20,21,26,0.55)" }}>
        N° de commande {partner} (facultatif)
        <input
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          className="mt-1 w-full text-[13.5px] px-3 py-2.5"
          style={inputStyle}
        />
      </label>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const res = await markOrderForwarded(orderId, ref);
            if (res?.error) setError(res.error);
          })
        }
        className="w-full text-[13px] font-medium py-2.5 rounded-[10px] cursor-pointer"
        style={{ background: "#14151A", color: "#FBFAF8" }}
      >
        Marquer « transmise à {partner} »
      </button>
      {error && (
        <div className="text-[12px] font-medium" style={{ color: "#A3243B" }}>
          {error}
        </div>
      )}
    </div>
  );
}
