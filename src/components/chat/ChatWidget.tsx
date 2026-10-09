"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { localeFromPathname, type Locale } from "@/lib/i18n";
import { store, storageKey } from "@/stores";

const BRAND = store.brand.name;

interface Msg {
  id: string;
  sender: "VISITOR" | "ADMIN";
  body: string;
  at: string;
}

const STORAGE_KEY = storageKey("chat");

const copyByLocale = {
  fr: {
    greeting: "Bonjour. Une question sur une pièce, une taille ou une commande ? Écrivez-nous, on vous répond - en direct ou par e-mail.",
    open: "Ouvrir le chat",
    dialog: `Chat ${BRAND}`,
    subtitle: "On vous répond en direct ou par e-mail",
    close: "Fermer",
    emailHelp: "Laissez votre e-mail - on vous répond même si vous quittez le site.",
    emailPlaceholder: "votre@email.fr",
    emailDone: "On vous recontactera à",
    messagePlaceholder: "Votre message...",
    send: "Envoyer",
  },
  en: {
    greeting: "Hello. A question about a piece, a size or an order? Write to us - we reply live or by email.",
    open: "Open chat",
    dialog: `${BRAND} chat`,
    subtitle: "We reply live or by email",
    close: "Close",
    emailHelp: "Leave your email - we can reply even if you leave the site.",
    emailPlaceholder: "you@email.com",
    emailDone: "We will get back to you at",
    messagePlaceholder: "Your message...",
    send: "Send",
  },
  he: {
    greeting: "שלום. יש לך שאלה על פריט, מידה או הזמנה? כתבי לנו - נענה בצ׳אט או במייל.",
    open: "פתיחת הצ׳אט",
    dialog: `צ׳אט ${BRAND}`,
    subtitle: "נענה בצ׳אט או במייל",
    close: "סגירה",
    emailHelp: "השאירי מייל - נוכל לענות גם אם תעזבי את האתר.",
    emailPlaceholder: "you@email.com",
    emailDone: "נחזור אלייך בכתובת",
    messagePlaceholder: "ההודעה שלך...",
    send: "שליחה",
  },
} satisfies Record<Locale, Record<string, string>>;

export function ChatWidget() {
  const pathname = usePathname();
  const locale = localeFromPathname(pathname);
  // Sur mobile, la fiche produit a une barre d'achat collée en bas : la bulle
  // passe au-dessus pour ne plus masquer le bouton « Ajouter au panier ».
  const bubbleBottom = /\/produit\//.test(pathname)
    ? "bottom-[calc(88px+env(safe-area-inset-bottom))] md:bottom-5"
    : "bottom-5";
  const copy = copyByLocale[locale];
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [unread, setUnread] = useState(0);
  const [sending, setSending] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [emailDone, setEmailDone] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  const tokenRef = useRef<string | null>(null);
  const openRef = useRef(false);
  const lastAtRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const remember = (msgs: Msg[]) => {
    if (msgs.length) lastAtRef.current = msgs[msgs.length - 1].at;
  };

  // Charge/rafraîchit les messages (poll).
  const poll = useCallback(async () => {
    const token = tokenRef.current;
    if (!token) return;
    try {
      const url = `/api/chat?token=${encodeURIComponent(token)}${
        lastAtRef.current ? `&after=${encodeURIComponent(lastAtRef.current)}` : ""
      }`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = (await res.json()) as { messages: Msg[] };
      if (data.messages?.length) {
        setMessages((prev) => {
          const known = new Set(prev.map((m) => m.id));
          const fresh = data.messages.filter((m) => !known.has(m.id));
          if (!fresh.length) return prev;
          remember([...prev, ...fresh]);
          if (!openRef.current) {
            const adminNew = fresh.filter((m) => m.sender === "ADMIN").length;
            if (adminNew) setUnread((u) => u + adminNew);
          }
          return [...prev, ...fresh];
        });
      }
    } catch {
      /* réseau : on réessaiera au prochain tick */
    }
  }, []);

  // Ouvre/reprend la conversation.
  const ensureConversation = useCallback(async () => {
    if (tokenRef.current) return;
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "open",
          token: stored || undefined,
          page: typeof window !== "undefined" ? window.location.pathname : undefined,
        }),
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        token: string;
        email: string | null;
        messages: Msg[];
      };
      tokenRef.current = data.token;
      try {
        localStorage.setItem(STORAGE_KEY, data.token);
      } catch {
        /* ignore */
      }
      if (data.email) {
        setEmail(data.email);
        setEmailDone(true);
      }
      setMessages(data.messages);
      remember(data.messages);
    } catch {
      /* ignore */
    }
  }, []);

  // Au montage : reprend une conversation existante (pour le badge) + poll.
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    if (stored) {
      tokenRef.current = stored;
      poll();
    }
    const id = setInterval(poll, 6000);
    return () => clearInterval(id);
  }, [poll]);

  // Scroll bas quand nouveaux messages / ouverture.
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  async function openPanel() {
    setOpen(true);
    setUnread(0);
    await ensureConversation();
  }

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");
    await ensureConversation();
    const token = tokenRef.current;
    if (!token) {
      setSending(false);
      return;
    }
    // Optimiste.
    const optimistic: Msg = {
      id: `tmp-${Date.now()}`,
      sender: "VISITOR",
      body: text,
      at: new Date().toISOString(),
    };
    setMessages((prev) => {
      const next = [...prev, optimistic];
      remember(next);
      return next;
    });
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "send", token, body: text }),
      });
      if (res.ok) {
        const data = (await res.json()) as { message: Msg };
        setMessages((prev) => {
          const next = prev.map((m) => (m.id === optimistic.id ? data.message : m));
          remember(next);
          return next;
        });
      }
    } catch {
      /* laissé optimiste */
    }
    setSending(false);
    if (!emailDone) setShowEmail(true);
  }

  async function submitEmail() {
    const e = emailInput.trim();
    if (!e.includes("@")) return;
    const token = tokenRef.current;
    if (!token) return;
    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "email", token, email: e }),
      });
    } catch {
      /* ignore */
    }
    setEmail(e);
    setEmailDone(true);
    setShowEmail(false);
  }

  return (
    <>
      {/* Bulle flottante */}
      {!open && (
        <button
          type="button"
          onClick={openPanel}
          aria-label={copy.open}
          className={`fixed ${bubbleBottom} right-5 z-[70] w-14 h-14 rounded-full flex items-center justify-center shadow-[0_12px_34px_-8px_rgba(28,23,18,0.5)] transition-transform hover:scale-105 cursor-pointer`}
          style={{ background: "#211c17", color: "#f7f3eb" }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          {unread > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1 rounded-full text-[11px] font-bold flex items-center justify-center"
              style={{ background: "#B23A2E", color: "#fff", boxShadow: "0 0 0 2px #211c17" }}
            >
              {unread}
            </span>
          )}
        </button>
      )}

      {/* Panneau */}
      {open && (
        <div
          className="fixed bottom-5 right-5 z-[70] w-[calc(100vw-40px)] max-w-[380px] h-[560px] max-h-[calc(100vh-40px)] flex flex-col rounded-2xl overflow-hidden bg-ivory-light"
          style={{ boxShadow: "0 24px 60px -18px rgba(28,23,18,0.55)" }}
          role="dialog"
          aria-label={copy.dialog}
        >
          {/* En-tête */}
          <div className="flex items-center justify-between px-5 py-4" style={{ background: "#211c17", color: "#f7f3eb" }}>
            <div>
              <div className="font-serif text-[17px]">{BRAND}</div>
              <div className="font-sans text-[11.5px] opacity-70">{copy.subtitle}</div>
            </div>
            <button onClick={() => setOpen(false)} aria-label={copy.close} className="opacity-80 hover:opacity-100 cursor-pointer text-[20px] leading-none">
              ×
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2.5" style={{ background: "#f7f3eb" }}>
            <Bubble sender="ADMIN" body={copy.greeting} />
            {messages.map((m) => (
              <Bubble key={m.id} sender={m.sender} body={m.body} />
            ))}
          </div>

          {/* Capture e-mail (après le 1er message, si pas encore donné) */}
          {showEmail && !emailDone && (
            <div className="px-4 py-3 border-t border-ink/8" style={{ background: "#fff" }}>
              <div className="font-sans text-[12.5px] text-warm-700 mb-2 leading-[1.5]">
                {copy.emailHelp}
              </div>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder={copy.emailPlaceholder}
                  className="flex-1 text-[13px] px-3 py-2 rounded-sm border border-ink/15 outline-none focus:border-ink/40 bg-ivory-light"
                />
                <button
                  onClick={submitEmail}
                  className="text-[12px] uppercase tracking-[0.06em] px-3 rounded-sm cursor-pointer"
                  style={{ background: "#211c17", color: "#f7f3eb" }}
                >
                  OK
                </button>
              </div>
            </div>
          )}
          {emailDone && email && (
            <div className="px-4 py-2 border-t border-ink/8 font-sans text-[11.5px] text-warm-500" style={{ background: "#fff" }}>
              ✓ {copy.emailDone} <strong className="text-ink">{email}</strong>
            </div>
          )}

          {/* Saisie */}
          <div className="flex items-end gap-2 px-4 py-3 border-t border-ink/10" style={{ background: "#fff" }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder={copy.messagePlaceholder}
              className="flex-1 resize-none text-[14px] px-3 py-2 rounded-lg border border-ink/15 outline-none focus:border-ink/40 bg-ivory-light max-h-[110px]"
            />
            <button
              onClick={send}
              disabled={sending || !input.trim()}
              aria-label={copy.send}
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-40"
              style={{ background: "#211c17", color: "#f7f3eb" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Bubble({ sender, body }: { sender: "VISITOR" | "ADMIN"; body: string }) {
  const mine = sender === "VISITOR";
  return (
    <div className={mine ? "self-end" : "self-start"} style={{ maxWidth: "82%" }}>
      <div
        className="font-sans text-[13.5px] leading-[1.5] px-3.5 py-2.5 whitespace-pre-wrap break-words"
        style={
          mine
            ? { background: "#211c17", color: "#f7f3eb", borderRadius: "14px 14px 4px 14px" }
            : { background: "#fff", color: "#211c17", borderRadius: "14px 14px 14px 4px", border: "1px solid rgba(28,23,18,0.08)" }
        }
      >
        {body}
      </div>
    </div>
  );
}
