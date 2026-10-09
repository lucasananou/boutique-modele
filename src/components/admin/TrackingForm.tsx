"use client";

import { useState, useTransition } from "react";
import { saveOrderTracking, type TrackingInput } from "@/app/admin/actions";
import { carriers } from "@/lib/carriers";

const inputStyle: React.CSSProperties = {
  background: "#FBFAF8",
  border: "1px solid rgba(20,21,26,0.1)",
  borderRadius: 10,
};

/** Saisie du transporteur + n° de suivi, avec passage en « Expédiée ». */
export function TrackingForm({
  orderId,
  status,
  initial,
}: {
  orderId: string;
  status: string;
  initial: { carrier?: string | null; number?: string | null; url?: string | null };
}) {
  const [carrier, setCarrier] = useState(initial.carrier || carriers[0].key);
  const [number, setNumber] = useState(initial.number ?? "");
  const [url, setUrl] = useState(initial.url ?? "");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(mode: TrackingInput["mode"]) {
    setMessage(null);
    startTransition(async () => {
      const res = await saveOrderTracking(orderId, { carrier, number, url, mode });
      if (res?.error) setMessage({ ok: false, text: res.error });
      else
        setMessage({
          ok: true,
          text: res.notified
            ? "Suivi enregistré, e-mail d'expédition envoyé à la cliente"
            : "Suivi enregistré",
        });
    });
  }

  const canShip = status === "PAID";
  const shipped = status === "SHIPPED" || status === "DELIVERED";

  return (
    <div className="flex flex-col gap-2.5">
      <label className="text-[12px]" style={{ color: "rgba(20,21,26,0.55)" }}>
        Transporteur
        <select
          name="carrier"
          value={carrier}
          onChange={(e) => setCarrier(e.target.value)}
          className="mt-1 w-full text-[13.5px] px-3 py-2.5"
          style={inputStyle}
        >
          {carriers.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <label className="text-[12px]" style={{ color: "rgba(20,21,26,0.55)" }}>
        Numéro de suivi
        <input
          name="trackingNumber"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          className="mt-1 w-full text-[13.5px] px-3 py-2.5"
          style={{ ...inputStyle, fontFamily: "var(--font-geist-mono), monospace" }}
        />
      </label>
      {carrier === "autre" && (
        <label className="text-[12px]" style={{ color: "rgba(20,21,26,0.55)" }}>
          Lien de suivi (facultatif)
          <input
            name="trackingUrl"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            className="mt-1 w-full text-[13px] px-3 py-2.5"
            style={inputStyle}
          />
        </label>
      )}
      {canShip && (
        <button
          type="button"
          disabled={pending}
          onClick={() => submit("ship")}
          className="w-full text-[13px] font-medium py-2.5 rounded-[10px] cursor-pointer"
          style={{ background: "#14151A", color: "#FBFAF8" }}
        >
          Enregistrer et marquer « Expédiée »
        </button>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => submit("save")}
        className="w-full text-[13px] font-medium py-2.5 rounded-[10px] cursor-pointer"
        style={{ background: "#fff", color: "rgba(20,21,26,0.7)", border: "1px solid rgba(20,21,26,0.12)" }}
      >
        Enregistrer le suivi
      </button>
      {shipped && initial.number && (
        <button
          type="button"
          disabled={pending}
          onClick={() => submit("resend")}
          className="w-full text-[12.5px] py-2 rounded-[10px] cursor-pointer"
          style={{ background: "transparent", color: "#1a5bff" }}
        >
          Renvoyer l&apos;e-mail d&apos;expédition avec le suivi
        </button>
      )}
      {canShip && (
        <p className="text-[11.5px] m-0" style={{ color: "rgba(20,21,26,0.45)" }}>
          « Expédiée » envoie l&apos;e-mail d&apos;expédition à la cliente, avec le lien de suivi.
        </p>
      )}
      {message && (
        <div className="text-[12px] font-medium" style={{ color: message.ok ? "#1F7A52" : "#A3243B" }}>
          {message.text}
        </div>
      )}
    </div>
  );
}
