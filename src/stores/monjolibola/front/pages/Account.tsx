import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isStripeLive } from "@/lib/stripe";
import type { SearchParams } from "@/stores/front";
import { LoginForm, ManageSubscription, RegisterForm } from "../AccountForms";
import { signOutAction } from "../actions";
import { loadCatalog } from "../catalog";
import { eur } from "../render";
import { ShopFrame } from "./Shop";

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const DAY = 86_400_000;
const iso = (d: Date) => d.toISOString().slice(0, 10);
function dateWindow(next: Date | null) {
  const now = Date.now();
  return { nextDate: iso(next ?? new Date(now + DAY)), minDate: iso(new Date(now + DAY)), maxDate: iso(new Date(now + 180 * DAY)) };
}
const longDate = (d: Date | null) => (d ? d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—");

const STATUS: Record<string, string> = {
  PENDING: "En attente de paiement",
  PAID: "Payée, en préparation",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
  REFUNDED: "Remboursée",
};

export async function Login({ searchParams }: { searchParams: SearchParams }) {
  if ((await auth())?.user) redirect("/compte");
  const next = one(searchParams.next) || one(searchParams.from) || "/compte";
  const catalog = await loadCatalog();
  return (
    <ShopFrame catalog={catalog} eyebrow="Compte" title="Bon retour">
      <div style={{ maxWidth: 560 }}>
        <LoginForm next={next.startsWith("/") ? next : "/compte"} />
      </div>
    </ShopFrame>
  );
}

export async function Register() {
  if ((await auth())?.user) redirect("/compte");
  const catalog = await loadCatalog();
  return (
    <ShopFrame catalog={catalog} eyebrow="Compte" title="Créer mon compte">
      <div style={{ maxWidth: 560 }}>
        <RegisterForm />
      </div>
    </ShopFrame>
  );
}

function SubscriptionCard({ sub }: { sub: NonNullable<Awaited<ReturnType<typeof prisma.subscription.findUnique>>> }) {
  const ended = sub.status === "canceled";
  return (
    <div className="shop-card">
      <span className={ended || sub.cancelAtPeriodEnd ? "status-chip" : "status-chip on"}>
        {ended ? "Terminé" : sub.cancelAtPeriodEnd ? "Résilié, se termine après ce cycle" : sub.status === "past_due" ? "Paiement à régulariser" : "Actif"}
      </span>
      <h2 style={{ marginTop: 14 }}>{sub.name}{sub.variantLabel ? `, ${sub.variantLabel}` : ""}</h2>
      <div className="account-list">
        <div className="account-row"><span>Livraison</span><b>Tous les {sub.intervalDays} jours, offerte</b></div>
        <div className="account-row"><span>Prix par livraison</span><b>{eur(sub.unitAmount)}</b></div>
        <div className="account-row"><span>{sub.cancelAtPeriodEnd ? "Se termine le" : "Prochaine livraison"}</span><b>{ended ? "—" : longDate(sub.nextChargeAt)}</b></div>
        <div className="account-row"><span>Adresse</span><b>{sub.shippingName}, {sub.shippingCity}</b></div>
      </div>
      {!ended && (
        <ManageSubscription
          token={sub.manageToken}
          cancelAtPeriodEnd={sub.cancelAtPeriodEnd}
          {...dateWindow(sub.nextChargeAt)}
          intervalDays={sub.intervalDays}
          portal={isStripeLive && Boolean(sub.stripeCustomerId)}
        />
      )}
      {!sub.stripeSubscriptionId && <p className="demo-note">Mode test : les changements sont enregistrés ici, aucune carte n’est débitée.</p>}
    </div>
  );
}

export async function AccountHome() {
  const session = await auth();
  if (!session?.user?.id) redirect("/compte/connexion?next=/compte");
  const userId = session.user.id;
  const [user, orders, subs, catalog] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true, role: true } }),
    prisma.order.findMany({ where: { userId, status: { not: "CANCELLED" } }, include: { items: true }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.subscription.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    loadCatalog(),
  ]);
  const admin = user?.role === "OWNER" || user?.role === "STAFF";
  return (
    <ShopFrame catalog={catalog} eyebrow="Compte" title={`Bonjour ${user?.name?.split(" ")[0] ?? ""}`.trim()} intro={user?.email}>
      <div className="shop-grid">
        <div>
          {subs.length > 0 ? (
            subs.map((s) => <SubscriptionCard key={s.id} sub={s} />)
          ) : (
            <div className="shop-card">
              <h2>Pas d’abonnement</h2>
              <p>Tous les 30, 45 ou 60 jours, 10 % de moins, sans engagement.</p>
              <a className="btn btn--plein" href="/#abonnement">Découvrir l’abonnement</a>
            </div>
          )}
        </div>
        <aside className="shop-card">
          <h2>Mes commandes</h2>
          {orders.length === 0 && <p>Aucune commande sur ce compte pour l’instant.</p>}
          <div className="account-list">
            {orders.map((o) => (
              <div className="account-row" key={o.id}>
                <span>
                  <b>{o.reference}</b><br />
                  <span className="fine">{o.createdAt.toLocaleDateString("fr-FR")} · {o.items.map((i) => `${i.name} × ${i.quantity}`).join(", ")}</span>
                </span>
                <span style={{ textAlign: "right" }}>
                  {eur(o.amountTotal)}<br />
                  <span className="fine">{STATUS[o.status] ?? o.status}{o.trackingNumber ? ` · ${o.trackingNumber}` : ""}</span>
                </span>
              </div>
            ))}
          </div>
          <div className="manage-actions">
            {admin && <a className="btn btn--line" href="/admin">Administration</a>}
            <form action={signOutAction}><button className="text-link">Se déconnecter</button></form>
          </div>
        </aside>
      </div>
    </ShopFrame>
  );
}

export async function SubscriptionByToken({ searchParams }: { searchParams: SearchParams }) {
  const token = one(searchParams.token);
  const [sub, catalog] = await Promise.all([
    token ? prisma.subscription.findUnique({ where: { manageToken: token } }) : Promise.resolve(null),
    loadCatalog(),
  ]);
  return (
    <ShopFrame catalog={catalog} eyebrow="Abonnement" title="Mes livraisons" intro="Sauter, décaler ou résilier en un clic.">
      {sub ? (
        <SubscriptionCard sub={sub} />
      ) : (
        <div className="shop-card">
          <h2>Lien non reconnu</h2>
          <p>Utilisez le bouton « Gérer mon abonnement » de votre dernier e-mail Aoyuki, ou connectez-vous à votre compte.</p>
          <a className="btn btn--plein" href="/compte/connexion">Se connecter</a>
        </div>
      )}
    </ShopFrame>
  );
}
