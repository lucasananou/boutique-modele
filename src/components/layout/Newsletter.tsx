"use client";

import { useState, useTransition } from "react";
import { subscribeNewsletter } from "@/app/(shop)/contact-actions";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/translations";

export function Newsletter({ locale = "fr" }: { locale?: Locale }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const copy = t(locale).newsletter;

  return (
    <section className="bg-ink text-ink-soft px-6 md:px-16 py-[90px] text-center">
      <div className="max-w-[560px] mx-auto">
        <div className="font-sans text-[11px] tracking-[0.3em] uppercase text-champagne-pale mb-4">
          {copy.eyebrow}
        </div>
        <h2 className="font-serif text-[30px] md:text-[40px] text-ivory mb-3.5">
          {copy.title}
        </h2>
        <p className="font-sans text-[14.5px] leading-[1.7] text-ink-soft/68 mb-8">
          {copy.body}
        </p>
        {done ? (
          <div className="font-sans text-[15px] text-champagne-light p-4">
            {copy.success}
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!email.includes("@")) return;
              startTransition(async () => {
                await subscribeNewsletter(email, locale);
                setDone(true);
              });
            }}
            className="flex border-b border-ink-soft/30 max-w-[440px] mx-auto"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={copy.placeholder}
              className="flex-1 bg-transparent border-none outline-none text-ivory font-sans text-[14px] py-3.5 px-1 placeholder:text-ink-soft/40"
            />
            <button
              type="submit"
              disabled={pending}
              className="font-sans text-[12px] tracking-[0.1em] uppercase text-ivory hover:text-champagne-light transition-colors py-3.5 px-2 cursor-pointer disabled:opacity-60"
            >
              {pending ? "…" : copy.submit}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
