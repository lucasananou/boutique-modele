import { prisma } from "@/lib/db";
import { stripe, isStripeLive } from "@/lib/stripe";
import { markOrderPaid } from "@/lib/orders";
import { stripeNextCharge } from "@/lib/subscriptions";
import type { SearchParams } from "@/stores/front";
import Shell from "../Shell";
import ClearBag from "../ClearBag";
import { usd } from "../packs";

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/**
 * Confirmation : accès par référence + jeton opaque (pas d'énumération).
 * Si le webhook Stripe n'est pas encore arrivé, la session est vérifiée ici
 * (markOrderPaid est idempotent).
 */
export default async function Success({ searchParams }: { searchParams: SearchParams }) {
  const ref = one(searchParams.ref);
  const token = one(searchParams.token);
  const sessionId = one(searchParams.session_id);
  let order = ref && token
    ? await prisma.order.findFirst({
        where: { reference: ref, confirmToken: token },
        include: { items: true, subscription: true },
      })
    : null;

  if (order && order.status === "PENDING" && isStripeLive && stripe && sessionId && order.stripeSessionId === sessionId) {
    const s = await stripe.checkout.sessions.retrieve(sessionId);
    if (s.payment_status === "paid") {
      const subId = typeof s.subscription === "string" ? s.subscription : s.subscription?.id;
      const sub = subId ? await stripe.subscriptions.retrieve(subId) : null;
      await markOrderPaid(order.id, {
        eventId: `return-${s.id}`,
        paymentIntent: typeof s.payment_intent === "string" ? s.payment_intent : undefined,
        stripeSubscriptionId: subId,
        stripeCustomerId: typeof s.customer === "string" ? s.customer : s.customer?.id,
        nextChargeAt: sub ? stripeNextCharge(sub) ?? undefined : undefined,
      });
      order = await prisma.order.findFirst({
        where: { id: order.id },
        include: { items: true, subscription: true },
      });
    }
  }

  if (!order) {
    return (
      <Shell>
        <section className="shop-page">
          <span className="badge">Order</span>
          <h1>We can&apos;t find this order</h1>
          <p>The link may be incomplete. Your confirmation email has the right one, or email support@firstdrawco.com.</p>
          <a className="pill" href="/">
            Back to the shop ↗
          </a>
        </section>
      </Shell>
    );
  }

  const paid = order.status !== "PENDING" && order.status !== "CANCELLED";
  const subtotal = order.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const sub = order.subscription;

  return (
    <Shell>
      <section className="shop-page">
        {paid && <ClearBag reference={order.reference} value={order.amountTotal / 100} />}
        <span className="badge">Order {order.reference}</span>
        <h1>{paid ? "Thank you, it's on its way soon" : "Payment in progress"}</h1>
        <p className="hand note">
          {paid ? "Your first morning scoop is being packed." : "This page updates once Stripe confirms the payment."}
        </p>
        <div className="shop-grid">
          <div className="shop-card">
            <h2>{paid ? "Confirmed" : "Waiting for payment"}</h2>
            <p>
              {paid
                ? `A confirmation is on its way to ${order.email}. Your jars ship from the US within 2 business days, then take 2 to 5 business days. We email your tracking link as soon as the parcel leaves.`
                : "If you closed the payment page, your bag is still saved. You can go back to checkout at any time."}
            </p>
            <h3>Shipping to</h3>
            <p>
              {order.shippingName}
              <br />
              {order.shippingLine1}
              {order.shippingLine2 ? (
                <>
                  <br />
                  {order.shippingLine2}
                </>
              ) : null}
              <br />
              {order.shippingCity}, {order.shippingState} {order.shippingZip}, United States
            </p>
            {sub && (
              <>
                <h3>Your subscription</h3>
                <p>
                  {sub.variantLabel} every {sub.intervalDays} days, {usd(sub.unitAmount)} per delivery, free shipping.
                  {sub.nextChargeAt ? ` Next delivery around ${sub.nextChargeAt.toLocaleDateString("en-US", { month: "long", day: "numeric" })}.` : ""}{" "}
                  We email you before each renewal.
                </p>
                <a className="pill outline" href={`/account/subscription?token=${sub.manageToken}`}>
                  Manage my subscription ↗
                </a>
              </>
            )}
            {!paid && (
              <a className="pill" href="/checkout">
                Back to checkout ↗
              </a>
            )}
            {searchParams.demo !== undefined && (
              <p className="demo-note">
                Test mode: no payment was taken. This store runs without live payment keys yet, so the order was confirmed directly.
              </p>
            )}
          </div>
          <aside className="shop-card">
            <h2>Summary</h2>
            {order.items.map((i) => (
              <div className="sum-line" key={i.id} style={{ gridTemplateColumns: "1fr auto" }}>
                <div>
                  {i.name}, {i.variantLabel?.toLowerCase()}
                  <small>
                    {i.intervalDays ? `Subscription, every ${i.intervalDays} days` : "One-time purchase"} · Qty {i.quantity}
                  </small>
                </div>
                <b>{usd(i.unitPrice * i.quantity)}</b>
              </div>
            ))}
            <div className="sum-total" style={{ marginTop: 10 }}>
              <span>Subtotal</span>
              <span>{usd(subtotal)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="sum-total">
                <span>Discount</span>
                <span>−{usd(order.discountAmount)}</span>
              </div>
            )}
            <div className="sum-total">
              <span>Shipping</span>
              <span>{order.shippingAmount ? usd(order.shippingAmount) : "Free"}</span>
            </div>
            <div className="sum-total grand">
              <span>Total</span>
              <span>{usd(order.amountTotal)}</span>
            </div>
          </aside>
        </div>
      </section>
    </Shell>
  );
}
