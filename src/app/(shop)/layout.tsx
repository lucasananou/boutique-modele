import { headers } from "next/headers";
import { auth } from "@/auth";
import { isAdminSession } from "@/lib/admin";
import { getTopbarSnapshot } from "@/lib/live/topbar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { ExitIntentCapture } from "@/components/cart/ExitIntentCapture";
import { CartRetentionBanner } from "@/components/cart/CartRetentionBanner";
import { ChatWidget } from "@/components/chat/ChatWidget";

// Chrome de la boutique (storefront). L'admin /admin a sa propre mise en page.
export default async function ShopLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // L'hôte réel descend jusqu'au sélecteur de langue : lui seul permet de
  // savoir si la langue visée vit sur un autre domaine. Le déduire de la locale
  // supposerait qu'on est toujours sur un domaine canonique — faux en local et
  // en préproduction, où tout est servi par un seul hôte.
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

  // Barre de pilotage réservée aux administrateurs. La session est en JWT :
  // `auth()` ne touche pas la base ; le rôle n'est lu en base que pour une
  // personne connectée — un visiteur anonyme ne paie rien.
  const session = await auth();
  const isAdmin = await isAdminSession(session);
  const topbar = isAdmin ? await getTopbarSnapshot("today") : null;

  return (
    <div className="bg-ivory text-ink min-h-full flex flex-col">
      {topbar && <AdminTopbar initial={topbar} />}
      <Header host={host} />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
      <ExitIntentCapture />
      <CartRetentionBanner />
      <ChatWidget />
    </div>
  );
}
