"use client";

import { useEffect, useRef, useState } from "react";

interface Convo {
  id: string;
  email: string | null;
  name: string | null;
  status: string;
  adminUnread: number;
  lastMessageAt: string;
  preview: string;
  lastSender: "VISITOR" | "ADMIN" | null;
  online: boolean;
  page: string | null;
}
interface Msg {
  id: string;
  sender: "VISITOR" | "ADMIN";
  body: string;
  at: string;
}

const ink = (o = 1) => `rgb(var(--ad-ink-rgb) / ${o})`;

function shortTime(iso: string) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export function MessagesInbox() {
  const [convos, setConvos] = useState<Convo[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [meta, setMeta] = useState<{ email: string | null; name: string | null; online: boolean } | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const lastAtRef = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Liste des conversations : poll toutes les 5 s.
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/admin/chat");
        if (!res.ok) return;
        const data = (await res.json()) as { conversations: Convo[] };
        if (alive) setConvos(data.conversations);
      } catch {
        /* ignore */
      }
    };
    load();
    const t = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  // Conversation sélectionnée : charge + poll toutes les 4 s.
  useEffect(() => {
    if (!sel) return;
    let alive = true;
    lastAtRef.current = null;
    const poll = async () => {
      try {
        const url = `/api/admin/chat/${sel}${
          lastAtRef.current ? `?after=${encodeURIComponent(lastAtRef.current)}` : ""
        }`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = (await res.json()) as {
          messages: Msg[];
          email: string | null;
          name: string | null;
          online: boolean;
        };
        if (!alive) return;
        setMeta({ email: data.email, name: data.name, online: data.online });
        if (data.messages.length) {
          setMsgs((prev) => {
            const known = new Set(prev.map((m) => m.id));
            const fresh = data.messages.filter((m) => !known.has(m.id));
            if (!fresh.length) return prev;
            const next = [...prev, ...fresh];
            lastAtRef.current = next[next.length - 1].at;
            return next;
          });
        }
      } catch {
        /* ignore */
      }
    };
    poll();
    const t = setInterval(poll, 4000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [sel]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs]);

  async function sendReply() {
    const text = reply.trim();
    const id = sel;
    if (!text || !id || sending) return;
    setSending(true);
    setReply("");
    const optimistic: Msg = { id: `tmp-${Date.now()}`, sender: "ADMIN", body: text, at: new Date().toISOString() };
    setMsgs((prev) => {
      const next = [...prev, optimistic];
      lastAtRef.current = next[next.length - 1].at;
      return next;
    });
    try {
      const res = await fetch(`/api/admin/chat/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      if (res.ok) {
        const data = (await res.json()) as { message: Msg };
        setMsgs((prev) => prev.map((m) => (m.id === optimistic.id ? data.message : m)));
      }
    } catch {
      /* ignore */
    }
    setSending(false);
  }

  const selConvo = convos.find((c) => c.id === sel);

  return (
    <div>
      <h1 className="m-0 text-[27px] font-semibold tracking-[-0.03em] mb-[22px]">Messages</h1>

      <div
        className="grid grid-cols-1 md:grid-cols-[300px_1fr] rounded-2xl overflow-hidden"
        style={{ border: `1px solid var(--ad-border)`, background: "var(--ad-surface)", minHeight: 560 }}
      >
        {/* Liste des conversations */}
        <div
          className={`${sel ? "hidden md:flex" : "flex"} flex-col`}
          style={{ borderRight: `1px solid var(--ad-border)` }}
        >
          <div className="px-4 py-3 text-[12px] tracking-[0.1em] uppercase" style={{ color: ink(0.42), borderBottom: `1px solid var(--ad-border)` }}>
            Conversations
          </div>
          <div className="flex-1 overflow-y-auto">
            {convos.length === 0 ? (
              <div className="px-4 py-10 text-center text-[13px]" style={{ color: ink(0.45) }}>
                Aucun message pour l&apos;instant.
              </div>
            ) : (
              convos.map((c) => {
                const active = c.id === sel;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSel(c.id);
                      setMsgs([]);
                      setMeta(null);
                      lastAtRef.current = null;
                    }}
                    className="w-full text-left px-4 py-3 flex flex-col gap-1 cursor-pointer transition-colors"
                    style={{
                      background: active ? ink(0.06) : "transparent",
                      borderBottom: `1px solid var(--ad-border)`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.online ? "#1F7A52" : ink(0.2) }} />
                      <span className="text-[13.5px] font-medium truncate flex-1" style={{ color: ink(0.9) }}>
                        {c.name || c.email || "Visiteuse anonyme"}
                      </span>
                      {c.adminUnread > 0 && (
                        <span className="min-w-[18px] h-[18px] px-1 rounded-full text-[10.5px] font-bold flex items-center justify-center" style={{ background: "#B23A2E", color: "#fff" }}>
                          {c.adminUnread}
                        </span>
                      )}
                    </div>
                    <div className="text-[12px] truncate" style={{ color: ink(0.5) }}>
                      {c.lastSender === "ADMIN" ? "Vous : " : ""}
                      {c.preview || "—"}
                    </div>
                    <div className="text-[11px]" style={{ color: ink(0.35) }}>{shortTime(c.lastMessageAt)}</div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Conversation */}
        <div className={`${sel ? "flex" : "hidden md:flex"} flex-col`} style={{ minHeight: 560 }}>
          {!sel ? (
            <div className="flex-1 flex items-center justify-center text-[14px]" style={{ color: ink(0.4) }}>
              Sélectionnez une conversation.
            </div>
          ) : (
            <>
              <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid var(--ad-border)` }}>
                <button onClick={() => setSel(null)} className="md:hidden text-[18px] cursor-pointer" style={{ color: ink(0.6) }} aria-label="Retour">‹</button>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium truncate" style={{ color: ink(0.9) }}>
                    {selConvo?.name || meta?.email || selConvo?.email || "Visiteuse anonyme"}
                  </div>
                  <div className="text-[11.5px]" style={{ color: ink(0.45) }}>
                    {meta?.online ? "🟢 En ligne" : "Hors ligne"}
                    {meta?.email ? ` · ${meta.email}` : selConvo?.email ? ` · ${selConvo.email}` : " · pas d'e-mail"}
                  </div>
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2.5" style={{ background: "var(--ad-bg)" }}>
                {msgs.map((m) => {
                  const mine = m.sender === "ADMIN";
                  return (
                    <div key={m.id} className={mine ? "self-end" : "self-start"} style={{ maxWidth: "78%" }}>
                      <div
                        className="text-[13.5px] leading-[1.5] px-3.5 py-2.5 whitespace-pre-wrap break-words"
                        style={
                          mine
                            ? { background: ink(0.9), color: "var(--ad-bg)", borderRadius: "14px 14px 4px 14px" }
                            : { background: "var(--ad-surface)", color: ink(0.9), borderRadius: "14px 14px 14px 4px", border: `1px solid var(--ad-border)` }
                        }
                      >
                        {m.body}
                      </div>
                      <div className={`text-[10.5px] mt-0.5 ${mine ? "text-right" : ""}`} style={{ color: ink(0.35) }}>
                        {new Date(m.at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {(meta?.email || selConvo?.email) && !meta?.online && (
                <div className="px-4 py-2 text-[11.5px]" style={{ color: ink(0.5), borderTop: `1px solid var(--ad-border)`, background: "var(--ad-surface)" }}>
                  Hors ligne → votre réponse lui sera envoyée par e-mail.
                </div>
              )}

              <div className="flex items-end gap-2 px-4 py-3" style={{ borderTop: `1px solid var(--ad-border)` }}>
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendReply();
                    }
                  }}
                  rows={1}
                  placeholder="Votre réponse…"
                  className="flex-1 resize-none text-[14px] px-3 py-2 rounded-lg outline-none max-h-[120px]"
                  style={{ border: `1px solid var(--ad-border)`, background: "var(--ad-bg)", color: ink(0.9) }}
                />
                <button
                  onClick={sendReply}
                  disabled={sending || !reply.trim()}
                  className="px-4 h-10 rounded-lg text-[13px] font-medium shrink-0 cursor-pointer disabled:opacity-40"
                  style={{ background: ink(0.9), color: "var(--ad-bg)" }}
                >
                  Envoyer
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
