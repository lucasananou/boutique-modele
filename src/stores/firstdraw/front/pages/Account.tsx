import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isStripeLive } from "@/lib/stripe";
import type { SearchParams } from "@/stores/front";
import Shell from "../Shell";
import { LoginForm, ManageSubscription, RegisterForm } from "../AccountForms";
import { signOutAction } from "../actions";
import { usd } from "../packs";

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const DAY = 86_400_000;
const iso = (d: Date) => d.toISOString().slice(0, 10);
/** Bornes du sélecteur de date (rendu serveur, à chaque requête). */
function dateWindow(next: Date | null) {
  const now = Date.now();
  return {
    nextDate: iso(next ?? new Date(now + DAY)),
    minDate: iso(new Date(now + DAY)),
    maxDate: iso(new Date(now + 180 * DAY)),
  };
}
const longDate = (d: Date | null) =>
  d ? d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—";

const STATUS: Record<string, string> = {
  PENDING: "Awaiting payment",
  PAID: "Paid, being prepared",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export async function Login({ searchParams }: { searchParams: SearchParams }) {
  if ((await auth())?.user) redirect("/account");
  const next = one(searchParams.next) || one(searchParams.from) || "/account";
  return (
    <Shell>
      <section className="shop-page" style={{ maxWidth: 620 }}>
        <span className="badge">Account</span>
        <h1>Welcome back</h1>
        <p className="hand note">Orders, deliveries, subscription.</p>
        <LoginForm next={next.startsWith("/") ? next : "/account"} />
      </section>
    </Shell>
  );
}

export async function Register() {
  if ((await auth())?.user) redirect("/account");
  return (
    <Shell>
      <section className="shop-page" style={{ maxWidth: 620 }}>
        <span className="badge">Account</span>
        <h1>Join First Draw</h1>
        <p className="hand note">Follow every delivery in one place.</p>
        <RegisterForm />
      </section>
    </Shell>
  );
}

function SubscriptionCard({
  sub,
}: {
  sub: NonNullable<Awaited<ReturnType<typeof prisma.subscription.findUnique>>>;
}) {
  const ended = sub.status === "canceled";
  return (
    <div className="shop-card">
      <span className={ended || sub.cancelAtPeriodEnd ? "status-chip" : "status-chip on"}>
        {ended ? "Ended" : sub.cancelAtPeriodEnd ? "Cancelled, ends after this cycle" : sub.status === "past_due" ? "Payment issue" : "Active"}
      </span>
      <h2 style={{ marginTop: 14 }}>
        {sub.name}, {sub.variantLabel?.toLowerCase()}
      </h2>
      <div className="account-list">
        <div className="account-row">
          <span>Delivery</span>
          <b>Every {sub.intervalDays} days, free shipping</b>
        </div>
        <div className="account-row">
          <span>Price per delivery</span>
          <b>{usd(sub.unitAmount)}</b>
        </div>
        <div className="account-row">
          <span>{sub.cancelAtPeriodEnd ? "Ends on" : "Next delivery"}</span>
          <b>{ended ? "—" : longDate(sub.nextChargeAt)}</b>
        </div>
        <div className="account-row">
          <span>Ships to</span>
          <b>
            {sub.shippingName}, {sub.shippingCity}, {sub.shippingState}
          </b>
        </div>
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
      {!sub.stripeSubscriptionId && (
        <p className="demo-note">Test mode: changes are saved here only, no card is charged.</p>
      )}
    </div>
  );
}

export async function AccountHome() {
  const session = await auth();
  if (!session?.user?.id) redirect("/account/login?next=/account");
  const userId = session.user.id;
  const [user, orders, subs] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true, role: true } }),
    prisma.order.findMany({
      where: { userId, status: { not: "CANCELLED" } },
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.subscription.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
  ]);
  const admin = user?.role === "OWNER" || user?.role === "STAFF";

  return (
    <Shell>
      <section className="shop-page">
        <span className="badge">Account</span>
        <h1>Hi {user?.name?.split(" ")[0] ?? "there"}</h1>
        <p className="hand note">{user?.email}</p>
        <div className="shop-grid">
          <div>
            {subs.length > 0 ? (
              subs.map((s) => <SubscriptionCard key={s.id} sub={s} />)
            ) : (
              <div className="shop-card">
                <h2>No subscription yet</h2>
                <p>Two jars every 60 days at 18% off, free shipping, skip or cancel in one click.</p>
                <a className="pill" href="/product">
                  Subscribe &amp; save ↗
                </a>
              </div>
            )}
          </div>
          <aside className="shop-card">
            <h2>Orders</h2>
            {orders.length === 0 && <p>No orders yet on this account. Orders placed while signed in appear here.</p>}
            <div className="account-list">
              {orders.map((o) => (
                <div className="account-row" key={o.id}>
                  <span>
                    <b>{o.reference}</b>
                    <br />
                    <span className="fine">
                      {o.createdAt.toLocaleDateString("en-US")} · {o.items.map((i) => `${i.variantLabel} × ${i.quantity}`).join(", ")}
                    </span>
                  </span>
                  <span style={{ textAlign: "right" }}>
                    {usd(o.amountTotal)}
                    <br />
                    <span className="fine">
                      {STATUS[o.status] ?? o.status}
                      {o.trackingNumber ? ` · ${o.trackingNumber}` : ""}
                    </span>
                  </span>
                </div>
              ))}
            </div>
            <div className="manage-actions">
              {admin && (
                <a className="pill outline" href="/admin">
                  Store admin ↗
                </a>
              )}
              <form action={signOutAction}>
                <button className="text-link">Sign out</button>
              </form>
            </div>
          </aside>
        </div>
      </section>
    </Shell>
  );
}

/** Gestion d'un abonnement par le lien des e-mails (sans compte). */
export async function SubscriptionByToken({ searchParams }: { searchParams: SearchParams }) {
  const token = one(searchParams.token);
  const sub = token ? await prisma.subscription.findUnique({ where: { manageToken: token } }) : null;
  return (
    <Shell>
      <section className="shop-page" style={{ maxWidth: 820 }}>
        <span className="badge">Subscription</span>
        <h1>Your deliveries</h1>
        <p className="hand note">Skip, move or cancel in one click.</p>
        {sub ? (
          <SubscriptionCard sub={sub} />
        ) : (
          <div className="shop-card">
            <h2>Link not recognised</h2>
            <p>Use the “Manage my subscription” button in your latest FIRST DRAW email, or sign in to your account.</p>
            <a className="pill" href="/account/login">
              Sign in ↗
            </a>
          </div>
        )}
      </section>
    </Shell>
  );
}
