"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { initials } from "@/lib/adminData";
import { useAdminPrefs } from "./AdminPrefsContext";
import type { AdminPrefs } from "@/lib/adminPrefs";

const items = [
  { label: "Dashboard", href: "/admin" },
  { label: "Live", href: "/admin/live" },
  { label: "Produits", href: "/admin/produits" },
  { label: "Catégories", href: "/admin/categories" },
  { label: "Contenus", href: "/admin/contenus" },
  { label: "Commandes", href: "/admin/commandes" },
  { label: "Paniers", href: "/admin/paniers" },
  { label: "Messages", href: "/admin/messages" },
  { label: "Clients", href: "/admin/clients" },
  { label: "Promotions", href: "/admin/promotions" },
  { label: "Paramètres", href: "/admin/parametres" },
];

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };
}

export function AdminNav({ adminName }: { adminName: string }) {
  const { prefs } = useAdminPrefs();
  // `menuTop` par défaut (SSR) → header sticky ; `side` → sidebar verticale.
  if (!prefs.menuTop) return <AdminSidebar adminName={adminName} />;
  return <AdminTopbar adminName={adminName} />;
}

/* ============================ TOP (header sticky) ============================ */

function AdminTopbar({ adminName }: { adminName: string }) {
  const isActive = useIsActive();

  return (
    <header
      data-ad-panel
      className="sticky top-0 z-30"
      style={{
        // Fond givré translucide dérivé de --ad-bg (thème clair/sombre).
        backgroundColor: "color-mix(in srgb, var(--ad-bg) 82%, transparent)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid var(--ad-border)",
      }}
    >
      <div className="max-w-[1080px] mx-auto px-6 h-[62px] flex items-center gap-8">
        <Logo />

        <nav className="admin-nav-scroll flex items-center gap-[26px] flex-1 overflow-x-auto">
          {items.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="text-[13.5px] font-medium py-5 whitespace-nowrap transition-colors"
                style={{
                  color: active
                    ? "rgb(var(--ad-ink-rgb))"
                    : "rgb(var(--ad-ink-rgb) / 0.5)",
                  borderBottom: `2px solid ${
                    active ? "rgb(var(--ad-ink-rgb))" : "transparent"
                  }`,
                  marginBottom: "-1px",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3.5 shrink-0">
          <Link
            href="/"
            title="Retour à la boutique"
            className="text-[12.5px] font-medium hidden sm:block transition-colors"
            style={{ color: "rgb(var(--ad-ink-rgb) / 0.5)" }}
          >
            ↗ Boutique
          </Link>
          <NotificationBell />
          <PrefsMenu adminName={adminName} align="right" />
        </div>
      </div>
    </header>
  );
}

/* ============================ SIDE (sidebar verticale) ====================== */

function AdminSidebar({ adminName }: { adminName: string }) {
  const isActive = useIsActive();

  return (
    <aside
      data-ad-panel
      className="sticky top-0 self-start h-screen w-[236px] shrink-0 flex flex-col"
      style={{
        backgroundColor: "var(--ad-bg)",
        borderRight: "1px solid var(--ad-border)",
      }}
    >
      <div className="px-5 h-[62px] flex items-center">
        <Logo />
      </div>

      <nav className="admin-nav-scroll flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-0.5">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="text-[13.5px] font-medium px-3 py-2.5 rounded-[9px] transition-colors"
              style={{
                color: active
                  ? "rgb(var(--ad-ink-rgb))"
                  : "rgb(var(--ad-ink-rgb) / 0.55)",
                background: active ? "rgb(var(--ad-ink-rgb) / 0.06)" : "transparent",
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div
        className="px-3 py-3 flex items-center gap-2"
        style={{ borderTop: "1px solid var(--ad-border)" }}
      >
        <Link
          href="/"
          title="Retour à la boutique"
          className="text-[12.5px] font-medium flex-1 px-3 py-2 rounded-[9px] transition-colors"
          style={{
            color: "rgb(var(--ad-ink-rgb) / 0.55)",
            background: "rgb(var(--ad-ink-rgb) / 0.04)",
          }}
        >
          ↗ Boutique
        </Link>
        <NotificationBell />
        <PrefsMenu adminName={adminName} align="up" />
      </div>
    </aside>
  );
}

/* ============================ Éléments partagés ============================= */

function Logo() {
  return (
    <Link href="/admin" className="flex items-center gap-[11px] shrink-0">
      <span
        className="w-[26px] h-[26px] rounded-[7px] flex items-center justify-center"
        style={{ background: "rgb(var(--ad-ink-rgb))" }}
      >
        <span
          className="w-[9px] h-[9px] rounded-full"
          style={{ background: "var(--ad-bg)" }}
        />
      </span>
      <span
        className="font-semibold tracking-[0.2em] text-[14px]"
        style={{ color: "rgb(var(--ad-ink-rgb))" }}
      >
        ADMIN
      </span>
    </Link>
  );
}

function NotificationBell() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/admin/chat?count=1");
        if (!res.ok) return;
        const d = (await res.json()) as { unread?: number };
        if (alive) setUnread(d.unread ?? 0);
      } catch {
        /* ignore */
      }
    };
    load();
    const t = setInterval(load, 15000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  return (
    <Link
      href="/admin/messages"
      title={unread > 0 ? `${unread} message(s) non lu(s)` : "Messages"}
      aria-label="Messages"
      className="relative w-8 h-8 rounded-full flex items-center justify-center transition-colors"
      style={{
        color: "rgb(var(--ad-ink-rgb) / 0.6)",
        border: "1px solid var(--ad-border)",
        background: "var(--ad-surface)",
      }}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {unread > 0 && (
        <span
          className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
          style={{
            background: "#ef4444",
            color: "#fff",
            boxShadow: "0 0 0 2px var(--ad-surface)",
          }}
        >
          {unread}
        </span>
      )}
    </Link>
  );
}

/* ---- Menu de préférences (ouvert depuis l'avatar) ------------------------- */

const OPTIONS: { key: keyof AdminPrefs; label: string }[] = [
  { key: "fullWidth", label: "Mode pleine largeur" },
  { key: "compact", label: "Mode compact" },
  { key: "menuTop", label: "Mode menu en haut" },
  { key: "dark", label: "Mode sombre" },
];

function PrefsMenu({
  adminName,
  align,
}: {
  adminName: string;
  align: "right" | "up";
}) {
  const { prefs, toggle } = useAdminPrefs();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  // Fermeture au clic extérieur + Échap.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Position du panneau : sous l'avatar (top) ou au-dessus (sidebar).
  const panelPos =
    align === "up"
      ? { bottom: "calc(100% + 8px)", right: 0 }
      : { top: "calc(100% + 8px)", right: 0 };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        title={adminName}
        className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold transition-transform"
        style={{
          background: "rgb(var(--ad-ink-rgb))",
          color: "var(--ad-bg)",
        }}
      >
        {initials(adminName, "AD")}
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          data-ad-panel
          className="absolute z-40 w-[248px] p-1.5 animate-fade"
          style={{
            ...panelPos,
            background: "var(--ad-surface)",
            border: "1px solid var(--ad-border)",
            borderRadius: 14,
            boxShadow:
              "0 12px 34px rgb(var(--ad-border-rgb) / 0.18), 0 2px 8px rgb(var(--ad-border-rgb) / 0.10)",
          }}
        >
          <div
            className="px-2.5 pt-2 pb-2 text-[11px] tracking-[0.13em] uppercase"
            style={{
              fontFamily: "var(--font-geist-mono), monospace",
              color: "rgb(var(--ad-ink-rgb) / 0.42)",
            }}
          >
            Affichage
          </div>

          {OPTIONS.map((opt) => (
            <CheckboxRow
              key={opt.key}
              label={opt.label}
              checked={prefs[opt.key]}
              onToggle={() => toggle(opt.key)}
            />
          ))}

          <div
            className="my-1.5 mx-1 h-px"
            style={{ background: "var(--ad-border)" }}
          />

          <Link
            href="/admin/parametres"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-[9px] text-[13px] font-medium transition-colors admin-menu-row"
            style={{ color: "rgb(var(--ad-ink-rgb) / 0.82)" }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Paramètres
          </Link>
        </div>
      )}
    </div>
  );
}

function CheckboxRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitemcheckbox"
      aria-checked={checked}
      onClick={onToggle}
      className="admin-menu-row w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[9px] text-[13px] font-medium transition-colors text-left"
      style={{ color: "rgb(var(--ad-ink-rgb) / 0.88)" }}
    >
      <span
        className="w-[17px] h-[17px] rounded-[5px] flex items-center justify-center shrink-0 transition-colors"
        style={{
          background: checked ? "rgb(var(--ad-ink-rgb))" : "transparent",
          border: checked
            ? "1px solid rgb(var(--ad-ink-rgb))"
            : "1px solid rgb(var(--ad-ink-rgb) / 0.28)",
        }}
      >
        {checked && (
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--ad-surface)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </span>
      {label}
    </button>
  );
}
