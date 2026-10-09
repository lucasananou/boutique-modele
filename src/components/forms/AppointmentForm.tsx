"use client";

import { useState, useTransition } from "react";
import { CheckIcon } from "@/components/ui/icons";
import { requestAppointment } from "@/app/(shop)/contact-actions";
import type { Locale } from "@/lib/i18n";

const copyByLocale = {
  fr: {
    types: ["Conseil de taille", "Retouches & ajustements", "Suivi de commande", "Autre question"],
    sentTitle: "Votre message est envoyé",
    sentBody: "Merci {first}. Notre équipe vous répond sous 24 h pour vous accompagner au mieux.",
    genericError: "Une erreur est survenue.",
    fullName: "Nom complet",
    email: "E-mail",
    phone: "Téléphone / WhatsApp",
    topic: "Objet du message",
    message: "Votre message (facultatif)",
    sending: "Envoi...",
    submit: "Envoyer mon message",
  },
  en: {
    types: ["Sizing advice", "Alterations & adjustments", "Order follow-up", "Other question"],
    sentTitle: "Your message has been sent",
    sentBody: "Thank you {first}. Our team will reply within 24 hours and guide you with care.",
    genericError: "Something went wrong.",
    fullName: "Full name",
    email: "Email",
    phone: "Phone / WhatsApp",
    topic: "Message topic",
    message: "Your message (optional)",
    sending: "Sending...",
    submit: "Send my message",
  },
  he: {
    types: ["ייעוץ מידה", "תיקונים והתאמות", "מעקב הזמנה", "שאלה אחרת"],
    sentTitle: "ההודעה שלך נשלחה",
    sentBody: "תודה {first}. הצוות שלנו יחזור אלייך תוך 24 שעות וילווה אותך בקפידה.",
    genericError: "אירעה שגיאה.",
    fullName: "שם מלא",
    email: "מייל",
    phone: "טלפון / WhatsApp",
    topic: "נושא ההודעה",
    message: "ההודעה שלך (לא חובה)",
    sending: "שולחת...",
    submit: "שליחת ההודעה",
  },
} satisfies Record<Locale, {
  types: string[];
  sentTitle: string;
  sentBody: string;
  genericError: string;
  fullName: string;
  email: string;
  phone: string;
  topic: string;
  message: string;
  sending: string;
  submit: string;
}>;

export function AppointmentForm({ locale = "fr" }: { locale?: Locale }) {
  const copy = copyByLocale[locale];
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    type: copy.types[0],
    message: "",
  });

  function update(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await requestAppointment({ ...form, locale });
      if (res.ok) setDone(true);
      else setError(res.error ?? copy.genericError);
    });
  }

  if (done) {
    return (
      <div className="bg-ivory-light border border-ink/10 rounded-md p-10 text-center">
        <div className="w-12 h-12 rounded-full bg-ink text-champagne-light flex items-center justify-center mx-auto mb-5">
          <CheckIcon width={22} height={22} />
        </div>
        <h3 className="font-serif text-[24px] text-ink mb-3">
          {copy.sentTitle}
        </h3>
        <p className="font-sans text-[14px] leading-[1.7] text-warm-700">
          {copy.sentBody.replace("{first}", form.name.split(" ")[0])}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="bg-ivory-light border border-ink/10 rounded-md p-7 md:p-9 grid grid-cols-1 sm:grid-cols-2 gap-4"
    >
      <Field
        label={copy.fullName}
        value={form.name}
        onChange={(v) => update("name", v)}
        required
        className="sm:col-span-2"
      />
      <Field
        label={copy.email}
        type="email"
        value={form.email}
        onChange={(v) => update("email", v)}
        required
      />
      <Field
        label={copy.phone}
        value={form.phone}
        onChange={(v) => update("phone", v)}
      />
      <label className="flex flex-col gap-1.5">
        <span className="font-sans text-[12px] text-warm-500">
          {copy.topic}
        </span>
        <select
          value={form.type}
          onChange={(e) => update("type", e.target.value)}
          className="font-sans text-[14px] text-ink bg-ivory-light border border-ink/15 rounded-xs px-3.5 py-3 outline-none focus:border-champagne cursor-pointer"
        >
          {copy.types.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 sm:col-span-2">
        <span className="font-sans text-[12px] text-warm-500">
          {copy.message}
        </span>
        <textarea
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
          rows={4}
          className="font-sans text-[14px] text-ink bg-ivory-light border border-ink/15 rounded-xs px-3.5 py-3 outline-none focus:border-champagne resize-none"
        />
      </label>
      {error && (
        <p className="sm:col-span-2 font-sans text-[13px] text-red-700">{error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="sm:col-span-2 font-sans text-[13px] tracking-[0.08em] uppercase text-ivory-light bg-ink py-4 rounded-xs hover:bg-champagne transition-colors cursor-pointer mt-2 disabled:opacity-60"
      >
        {pending ? copy.sending : copy.submit}
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={["flex flex-col gap-1.5", className].join(" ")}>
      <span className="font-sans text-[12px] text-warm-500">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="font-sans text-[14px] text-ink bg-ivory-light border border-ink/15 rounded-xs px-3.5 py-3 outline-none focus:border-champagne"
      />
    </label>
  );
}
