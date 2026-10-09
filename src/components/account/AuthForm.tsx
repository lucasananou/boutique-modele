"use client";

import { useActionState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { FormState } from "@/app/(shop)/compte/actions";
import { localeFromPathname, localizedPath } from "@/lib/i18n";
import { t } from "@/lib/translations";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

export function AuthForm({
  mode,
  action,
}: {
  mode: "login" | "register";
  action: Action;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    {},
  );
  const isRegister = mode === "register";
  const locale = localeFromPathname(usePathname());
  const copy = t(locale).account;

  return (
    <div className="max-w-[420px] mx-auto px-6 py-16 md:py-24">
      <div className="text-center mb-10">
        <div className="eyebrow mb-4">
          {isRegister ? copy.registerEyebrow : copy.loginEyebrow}
        </div>
        <h1 className="font-serif font-normal text-[34px] text-ink">
          {isRegister ? copy.registerTitle : copy.loginTitle}
        </h1>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="locale" value={locale} />
        {isRegister && (
          <Field name="name" label={copy.fullName} required autoComplete="name" />
        )}
        <Field
          name="email"
          label={copy.email}
          type="email"
          required
          autoComplete="email"
        />
        <Field
          name="password"
          label={copy.password}
          type="password"
          required
          autoComplete={isRegister ? "new-password" : "current-password"}
        />

        {state.error && (
          <p className="font-sans text-[13px] text-red-700">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 font-sans text-[13px] tracking-[0.08em] uppercase text-ivory-light bg-ink py-4 rounded-xs hover:bg-champagne transition-colors cursor-pointer disabled:opacity-60"
        >
          {pending
            ? copy.pending
            : isRegister
              ? copy.registerCta
              : copy.loginCta}
        </button>
      </form>

      <p className="font-sans text-[13px] text-warm-500 text-center mt-7">
        {isRegister ? (
          <>
            {copy.alreadyCustomer}{" "}
            <Link
              href={localizedPath("/compte/connexion", locale)}
              className="text-ink border-b border-champagne hover:text-champagne transition-colors"
            >
              {copy.loginCta}
            </Link>
          </>
        ) : (
          <>
            {copy.firstVisit}{" "}
            <Link
              href={localizedPath("/compte/inscription", locale)}
              className="text-ink border-b border-champagne hover:text-champagne transition-colors"
            >
              {copy.createAccount}
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
  autoComplete,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-sans text-[12px] text-warm-500">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="font-sans text-[14px] text-ink bg-ivory-light border border-ink/15 rounded-xs px-3.5 py-3 outline-none focus:border-champagne"
      />
    </label>
  );
}
