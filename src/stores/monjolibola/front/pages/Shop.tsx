import type { ReactNode } from "react";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { isStripeLive, stripe } from "@/lib/stripe";
import { markOrderPaid } from "@/lib/orders";
import { stripeNextCharge } from "@/lib/subscriptions";
import type { SearchParams } from "@/stores/front";
import Page from "../Page";
import type { Catalog } from "../catalog";
import { commandesOuvertes, loadCatalog } from "../catalog";
import CheckoutForm from "../CheckoutForm";
import PanierView from "../PanierView";
import ClearCart from "../ClearCart";
import { eur } from "../render";

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export function ShopFrame({ catalog, eyebrow, title, intro, children }: { catalog: Catalog; eyebrow: string; title: string; intro?: string; children: ReactNode }) {
  return (
    <Page>
      <section className="shop-page">
        <p className="sur">{eyebrow}</p>
        <h1 className="h2">{title}</h1>
        {intro && <p className="shop-page__intro">{intro}</p>}
        {children}
      </section>
    </Page>
  );
}

export async function Panier() {
  const catalog = await loadCatalog();
  return (
    <ShopFrame catalog={catalog} eyebrow="Panier" title="Votre panier">
      <PanierView />
    </ShopFrame>
  );
}

export async function Commande() {
  if (!commandesOuvertes()) {
    const c = await loadCatalog();
    return <ShopFrame catalog={c} eyebrow="Commande" title="Boutique bientôt de retour, commandes fermées"><a className="btn btn--plein" href="/boutique">Voir nos bolas</a></ShopFrame>;
  }
  const session = await auth();
  const user = session?.user?.id
    ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true, name: true } })
    : null;
  const catalog = await loadCatalog();
  return (
    <ShopFrame catalog={catalog} eyebrow="Commande" title="Finaliser ma commande">
      <CheckoutForm defaultEmail={user?.email} defaultName={user?.name ?? undefined} signedIn={Boolean(user)} testMode={!isStripeLive} />
    </ShopFrame>
  );
}

/** Confirmation : référence + jeton opaque (pas d'énumération). */
export async function Confirmation({ searchParams }: { searchParams: SearchParams }) {
  const ref = one(searchParams.ref);
  const token = one(searchParams.token);
  const sessionId = one(searchParams.session_id);
  const catalog = await loadCatalog();
  let order = ref && token
    ? await prisma.order.findFirst({ where: { reference: ref, confirmToken: token }, include: { items: true, subscription: true } })
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
      order = await prisma.order.findFirst({ where: { id: order.id }, include: { items: true, subscription: true } });
    }
  }

  if (!order) {
    return (
      <ShopFrame catalog={catalog} eyebrow="Commande" title="Commande introuvable" intro="Le lien semble incomplet. Votre e-mail de confirmation contient le bon lien.">
        <a className="btn btn--plein" href="/">Retour à l’accueil</a>
      </ShopFrame>
    );
  }

  const paid = order.status !== "PENDING" && order.status !== "CANCELLED";
  const subtotal = order.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const sub = order.subscription;
  return (
    <ShopFrame catalog={catalog} eyebrow={`Commande ${order.reference}`} title={paid ? "Merci, c’est confirmé" : "Paiement en cours"}>
      {paid && <ClearCart reference={order.reference} />}
      <div className="shop-grid">
        <div className="shop-card">
          <h2>{paid ? "Confirmée" : "En attente du paiement"}</h2>
          <p>
            {paid
              ? `Une confirmation part à l’adresse ${order.email}. Nous vous écrirons dès que le colis sera expédié.`
              : "Si vous avez fermé la page de paiement, votre panier reste enregistré."}
          </p>
          <h3>Livraison</h3>
          <p>
            {order.shippingName}<br />
            {order.shippingLine1}
            {order.shippingLine2 ? <><br />{order.shippingLine2}</> : null}
            <br />{order.shippingZip} {order.shippingCity}, France
          </p>
          {sub && (
            <>
              <h3>Votre abonnement</h3>
              <p>
                {sub.name}, {sub.variantLabel} : tous les {sub.intervalDays} jours, {eur(sub.unitAmount)} la livraison, sans engagement.
              </p>
              <a className="btn btn--line" href={`/compte/abonnement?token=${sub.manageToken}`}>Gérer mon abonnement</a>
            </>
          )}
          {!paid && <a className="btn btn--plein" href="/commande">Retour à la commande</a>}
          {searchParams.demo !== undefined && (
            <p className="demo-note">Mode test : aucun paiement n’a été pris. La boutique tourne sans clé de paiement, la commande a été validée directement.</p>
          )}
        </div>
        <aside className="shop-card">
          <h2>Récapitulatif</h2>
          {order.items.map((i) => (
            <div className="sum-line" key={i.id} style={{ gridTemplateColumns: "1fr auto" }}>
              <div>
                {i.name}{i.variantLabel ? `, ${i.variantLabel}` : ""}
                <small>{i.intervalDays ? `Abonnement, tous les ${i.intervalDays} jours` : "Achat unique"} · Qté {i.quantity}</small>
              </div>
              <b>{eur(i.unitPrice * i.quantity)}</b>
            </div>
          ))}
          <div className="sum-total" style={{ marginTop: 10 }}><span>Sous-total</span><span>{eur(subtotal)}</span></div>
          {order.discountAmount > 0 && <div className="sum-total"><span>Remise</span><span>−{eur(order.discountAmount)}</span></div>}
          <div className="sum-total"><span>Livraison</span><span>{order.shippingAmount ? eur(order.shippingAmount) : "Offerte"}</span></div>
          <div className="sum-total grand"><span>Total TTC</span><span>{eur(order.amountTotal)}</span></div>
        </aside>
      </div>
    </ShopFrame>
  );
}
