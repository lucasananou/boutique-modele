import type { ReactNode } from "react";
import { store } from "@/stores";
import Shell from "../Shell";

/*
 * Pages légales minimales (anglais, vente aux États-Unis). Le vendeur vient de
 * config.seller ; les règles de livraison et d'abonnement de la config.
 * Textes à faire relire avant l'ouverture réelle des ventes.
 */

const UPDATED = "October 17, 2026";
const seller = store.seller!;
const email = seller.email ?? store.brand.contact.email;
const ship = store.commerce.shipping;
const sub = store.subscriptions;
const money = (c: number) => `$${(c / 100).toFixed(2)}`;

function LegalPage({ badge, title, children }: { badge: string; title: string; children: ReactNode }) {
  return (
    <Shell>
      <article className="legal-page">
        <span className="badge">{badge}</span>
        <h1>{title}</h1>
        <p className="fine">Last updated {UPDATED}</p>
        {children}
      </article>
    </Shell>
  );
}

function SellerBlock() {
  return (
    <p>
      FIRST DRAW is a brand of <b>{seller.name}</b>, a {seller.form.toLowerCase()} registered with the {seller.authority} ({seller.registration}),{" "}
      {seller.address}. Contact: <a href={`mailto:${email}`}>{email}</a>.
    </p>
  );
}

export function Terms() {
  return (
    <LegalPage badge="Terms" title="Terms of Sale and Use">
      <h2>Who we are</h2>
      <SellerBlock />
      <h2>The product</h2>
      <p>
        Colostrum 575 is a dietary supplement: grass-fed bovine colostrum powder, 575 mg of IgG per 2.3 g serving, 30 servings per
        jar. It contains milk. Read the label before use and ask your healthcare provider first if you are pregnant, nursing,
        immunocompromised, taking medication or allergic to milk.
      </p>
      <p>
        *These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose,
        treat, cure, or prevent any disease.
      </p>
      <h2>Orders and prices</h2>
      <p>
        Prices are in US dollars. Your order is confirmed when payment is accepted and you receive a confirmation email. We may
        cancel and fully refund an order if a product is unavailable, an address cannot be served, or a price was displayed in
        obvious error. Where we are required to collect sales tax, it is shown before you pay.
      </p>
      <h2>Payment</h2>
      <p>
        Payments are processed by Stripe. We never see or store your full card number. Subscriptions are charged automatically on
        each renewal date, as described in our <a href="/subscription-terms">Subscription Terms</a>.
      </p>
      <h2>Shipping, returns and guarantee</h2>
      <p>
        We ship to the United States only. Delivery times, costs and our 60-day money-back guarantee are described on the{" "}
        <a href="/shipping-returns">Shipping &amp; Returns</a> page.
      </p>
      <h2>Use of this website</h2>
      <p>
        Content on this site is for general information and is not medical advice. Our liability for any order is limited to the
        amount you paid for it, to the extent permitted by law. Nothing in these terms limits rights you have under the consumer
        protection laws of your state.
      </p>
      <h2>Contact</h2>
      <p>
        Questions about an order or these terms: <a href={`mailto:${email}`}>{email}</a>. We answer within one business day.
      </p>
    </LegalPage>
  );
}

export function Privacy() {
  return (
    <LegalPage badge="Privacy" title="Privacy Policy">
      <h2>Who is responsible</h2>
      <SellerBlock />
      <h2>What we collect</h2>
      <ul>
        <li>Order data: name, email, shipping address, phone number if you give it, what you bought and when.</li>
        <li>Account data, if you create an account: name, email, a hashed password.</li>
        <li>Newsletter: your email, if you sign up.</li>
        <li>Payment data is collected and processed by Stripe; we only receive the payment status and the last card digits.</li>
      </ul>
      <h2>Why we use it</h2>
      <p>
        To process and ship your order, run your subscription, send order and renewal emails, answer your questions, and comply with
        our legal and tax obligations. We send marketing emails only if you subscribed, and every email lets you unsubscribe.
      </p>
      <h2>Who we share it with</h2>
      <ul>
        <li>Stripe (payments and subscription billing).</li>
        <li>Our US manufacturing and fulfillment partner, which receives your name, shipping address and order to ship it.</li>
        <li>Our email delivery provider, to send transactional emails.</li>
        <li>OVH, which hosts this website.</li>
      </ul>
      <p>
        We do not sell your personal information and we do not share it for cross-context behavioral advertising. If we add
        advertising measurement in the future, this policy will say so first and offer a “Do not sell or share” choice where the law
        of your state requires it.
      </p>
      <h2>Cookies</h2>
      <p>
        We use only what the site needs to work: your bag (stored in your browser) and a sign-in cookie if you log in. No advertising
        cookies are set today.
      </p>
      <h2>Your rights</h2>
      <p>
        You can ask to access, correct or delete your personal information, or to stop receiving emails, by writing to{" "}
        <a href={`mailto:${email}`}>{email}</a>. We keep order records for as long as tax and accounting rules require.
      </p>
    </LegalPage>
  );
}

export function ShippingReturns() {
  return (
    <LegalPage badge="Support" title="Shipping & Returns">
      <h2>Where we ship</h2>
      <p>
        Within the United States only: the 50 states and Washington, D.C. We can&apos;t ship to PO boxes, APO/FPO/DPO addresses or US
        territories yet.
      </p>
      <h2>How long it takes</h2>
      <p>
        Orders are prepared within {store.commerce.handlingDays[1]} business days, then take {store.commerce.transitDays[0]} to{" "}
        {store.commerce.transitDays[1]} business days to arrive. You get an email with your tracking link as soon as the parcel
        leaves the warehouse.
      </p>
      <h2>What it costs</h2>
      <p>
        {ship
          ? `Shipping is free on orders of ${money(ship.freeOver ?? 0)} or more and on every subscription delivery. Below ${money(ship.freeOver ?? 0)}, standard shipping is ${money(ship.flatRate)}.`
          : "Shipping is free."}
      </p>
      <h2>60-day money-back guarantee</h2>
      <p>
        Take it for up to 60 days after delivery. If you would not buy it again, email{" "}
        <a href={`mailto:${email}`}>{email}</a> with your order number and we refund that order to your original payment method,
        even if the jar is opened or empty. You don&apos;t need to send it back. One guarantee refund per customer.
      </p>
      <h2>Damaged or missing parcel</h2>
      <p>
        If your jar arrives damaged or your tracking shows delivered but nothing arrived, email us within 30 days with a photo or
        your order number and we send a replacement or refund it.
      </p>
      <h2>Subscriptions</h2>
      <p>
        You can skip, move or cancel a delivery online in one click. See our <a href="/subscription-terms">Subscription Terms</a>.
      </p>
    </LegalPage>
  );
}

export function SubscriptionTerms() {
  return (
    <LegalPage badge="Subscribe & Save" title="Subscription Terms">
      <h2>How it works</h2>
      <p>
        When you choose Subscribe &amp; Save, you buy a pack of Colostrum 575 that renews automatically every{" "}
        {sub ? sub.intervals.join(", ").replace(/, (\d+)$/, " or $1") : "30"} days, depending on the frequency you pick, until you
        cancel. Each delivery is {sub?.discountPercent ?? 0}% below the one-time price of the same pack, and shipping is always free.
      </p>
      <h2>Billing</h2>
      <p>
        Your first delivery is charged when you order. Each renewal is charged automatically, at the price shown when you subscribed,
        to the payment method you used, on the renewal date shown in your account. We email you before every renewal. If we ever
        change the subscription price, we tell you by email at least 30 days before it applies, and you can cancel before then.
      </p>
      <h2>Skip, move or cancel in one click</h2>
      <p>
        From your account, or from the “Manage my subscription” link in any of our emails, you can skip the next delivery, move it to
        another date, or cancel, at any time before the renewal date. No phone call, no email thread. A cancellation stops all future
        charges; a delivery already charged still ships.
      </p>
      <h2>Failed payments</h2>
      <p>
        If a renewal payment fails, we retry it and email you a link to update your card. The delivery ships once payment goes through.
        If payment still fails after several attempts, the subscription is cancelled.
      </p>
      <h2>Guarantee</h2>
      <p>
        Your first subscription order is covered by our 60-day money-back guarantee, like any first order. See{" "}
        <a href="/shipping-returns">Shipping &amp; Returns</a>.
      </p>
      <h2>Seller</h2>
      <SellerBlock />
    </LegalPage>
  );
}
