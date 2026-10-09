"use client";

import { useState } from "react";
import { useCart } from "@/lib/store/cart";
import { markCaptured } from "@/lib/leadCapture";
import type { Locale } from "@/lib/i18n";

const copyByLocale = {
  fr: {
    genericError: "Une erreur est survenue.",
    networkError: "Connexion impossible. Réessayez.",
    doneTitle: "Votre panier est gardé",
    doneBody: "Votre code {code} (-10 %) vous attend au paiement - on vous l'a aussi envoyé par e-mail.",
    continue: "Continuer",
    placeholder: "Votre adresse e-mail",
    submit: "Recevoir -10 %",
    consent: "En validant, vous acceptez de recevoir nos e-mails (panier, offres). Désinscription à tout moment.",
  },
  en: {
    genericError: "Something went wrong.",
    networkError: "Unable to connect. Please try again.",
    doneTitle: "Your cart is saved",
    doneBody: "Your code {code} (-10%) is waiting at checkout - we also sent it to you by email.",
    continue: "Continue",
    placeholder: "Your email address",
    submit: "Get 10% off",
    consent: "By submitting, you agree to receive our emails about your cart and offers. You can unsubscribe at any time.",
  },
  he: {
    genericError: "אירעה שגיאה.",
    networkError: "לא ניתן להתחבר. נסי שוב.",
    doneTitle: "העגלה שלך נשמרה",
    doneBody: "הקוד שלך {code} (10% הנחה) מחכה בתשלום - שלחנו אותו גם במייל.",
    continue: "המשך",
    placeholder: "כתובת המייל שלך",
    submit: "לקבלת 10% הנחה",
    consent: "בלחיצה, את מסכימה לקבל מיילים על העגלה והצעות. אפשר להסיר הרשמה בכל עת.",
  },
} satisfies Record<Locale, Record<string, string>>;

/**
 * Formulaire de capture d'e-mail au panier. Envoie l'e-mail + le contenu du
 * panier à /api/cart/lead (qui crée un panier « lead » relançable) et affiche
 * le code −10 %. Partagé entre le tiroir panier et le popup exit-intent.
 */
export function LeadCaptureForm({
  onDone,
  autoFocus,
  locale = "fr",
}: {
  onDone?: () => void;
  autoFocus?: boolean;
  locale?: Locale;
}) {
  const lines = useCart((s) => s.lines);
  const giftWrap = useCart((s) => s.giftWrap);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [code, setCode] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const copy = copyByLocale[locale];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@") || lines.length === 0) return;
    setState("loading");
    setErr(null);
    try {
      const res = await fetch("/api/cart/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          locale,
          giftWrap,
          lines: lines.map((l) => ({
            productId: l.productId,
            slug: l.slug,
            variantId: l.variantId,
            variantLabel: l.variantLabel,
            engraving: l.engraving,
            quantity: l.quantity,
          })),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        code?: string;
        error?: string;
      };
      if (!res.ok) {
        setErr(json.error || copy.genericError);
        setState("error");
        return;
      }
      setCode(json.code ?? null);
      markCaptured(email);
      setState("done");
    } catch {
      setErr(copy.networkError);
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="text-center">
        <div className="font-serif text-[18px] text-ink mb-1.5">
          {copy.doneTitle} ✓
        </div>
        <p className="font-sans text-[13px] text-warm-500 leading-[1.6]">
          {copy.doneBody.split("{code}")[0]}
          <strong className="text-ink tracking-[0.05em]">{code}</strong>
          {copy.doneBody.split("{code}")[1]}
        </p>
        {onDone && (
          <button
            onClick={onDone}
            className="mt-4 font-sans text-[12px] uppercase tracking-[0.08em] text-ink border-b border-champagne pb-1 hover:text-champagne transition-colors cursor-pointer"
          >
            {copy.continue}
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <div className="flex border-b border-ink/20">
        <input
          type="email"
          required
          value={email}
          autoFocus={autoFocus}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={copy.placeholder}
          className="flex-1 bg-transparent outline-none font-sans text-[14px] text-ink py-3 placeholder:text-warm-500/60"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="font-sans text-[12px] uppercase tracking-[0.09em] text-ink hover:text-champagne transition-colors py-3 pl-3 whitespace-nowrap cursor-pointer disabled:opacity-60"
        >
          {state === "loading" ? "..." : copy.submit}
        </button>
      </div>
      {err && (
        <p className="font-sans text-[12px] text-[#B23A2E] mt-2">{err}</p>
      )}
      <p className="font-sans text-[11px] text-warm-500/80 leading-[1.5] mt-2.5">
        {copy.consent}
      </p>
    </form>
  );
}
