import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { requireAdmin } from "@/lib/admin";
import { AdminShell } from "@/components/admin/AdminShell";
import { DEFAULT_ADMIN_PREFS } from "@/lib/adminPrefs";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();

  // Wrapper `.admin-root` rendu ici (server). Les data-* démarrent aux valeurs
  // par défaut ; AdminShell les resynchronise depuis localStorage dans un
  // `useLayoutEffect` au montage (avant peinture) → au pire un très bref flash
  // au premier chargement, acceptable et sans avertissement React.
  return (
    <div
      id="admin-root"
      className={`${geist.variable} ${geistMono.variable} admin-root min-h-screen`}
      data-theme={DEFAULT_ADMIN_PREFS.dark ? "dark" : "light"}
      data-menu={DEFAULT_ADMIN_PREFS.menuTop ? "top" : "side"}
      style={{ fontFamily: "var(--font-geist), -apple-system, sans-serif" }}
    >
      <AdminShell
        adminName={session.user?.name ?? session.user?.email ?? "Admin"}
      >
        {children}
      </AdminShell>
    </div>
  );
}
