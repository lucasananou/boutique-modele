import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import type { FrontRoute, StoreFront } from "@/stores/front";
import { fontVariables } from "../fonts";
import Interactions from "./Interactions";
import Pixels from "./Pixels";
import Shell from "./Shell";
import { loadCatalog } from "./catalog";
import Home from "./pages/Home";
import Product, { metadata as productMeta } from "./pages/Product";
import Advertorial, { metadata as advertorialMeta } from "./pages/Advertorial";
import Checkout from "./pages/Checkout";
import Success from "./pages/Success";
import { AccountHome, Login, Register, SubscriptionByToken } from "./pages/Account";
import { Privacy, ShippingReturns, SubscriptionTerms, Terms } from "./pages/Legal";
import "./styles.css";

/*
 * Vitrine FIRST DRAW : la maquette (design « Mycel ») portée telle quelle,
 * branchée sur le back-end du modèle (catalogue en base, /api/checkout,
 * Stripe, abonnements, comptes, e-mails). Voir src/stores/front.ts.
 */

// Tant que Lucas n'a pas ouvert le site : aucune page indexable.
const robots: Metadata["robots"] = { index: false, follow: false };

function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <dialog id="modal">
        <button id="close" type="button" aria-label="Close">
          ×
        </button>
        <div id="modal-content" />
      </dialog>
      <div id="toast" role="status" />
      <Interactions />
      <Pixels />
    </>
  );
}

function NotFound() {
  return (
    <Shell>
      <section className="shop-page" style={{ maxWidth: 820 }}>
        <span className="badge">404</span>
        <h1>This page wandered off</h1>
        <p className="hand note">The jar is still where you left it.</p>
        <a className="pill" href="/">
          Back to the shop ↗
        </a>
      </section>
    </Shell>
  );
}

/** Pages qui lisent le catalogue (prix en base). */
async function withCatalog(render: (c: NonNullable<Awaited<ReturnType<typeof loadCatalog>>>) => ReactNode) {
  const catalog = await loadCatalog();
  if (!catalog || catalog.packs.length === 0) notFound();
  return render(catalog);
}

const page = (title: string): Metadata => ({ title: `${title} | FIRST DRAW`, robots });

const ROUTES: Record<string, FrontRoute> = {
  "": {
    metadata: { title: "FIRST DRAW | Colostrum for the modern morning", robots },
    render: () => withCatalog((c) => <Home catalog={c} />),
  },
  product: {
    metadata: { ...productMeta, robots },
    render: () => withCatalog((c) => <Product catalog={c} />),
  },
  "pages/first-draw-hidden-discount": {
    metadata: { ...advertorialMeta, robots },
    render: () => withCatalog((c) => <Advertorial catalog={c} />),
  },
  checkout: { metadata: page("Checkout"), render: () => <Checkout /> },
  "checkout/success": {
    metadata: page("Order confirmed"),
    render: ({ searchParams }) => <Success searchParams={searchParams} />,
  },
  account: { metadata: page("Your account"), render: () => <AccountHome /> },
  "account/login": {
    metadata: page("Sign in"),
    render: ({ searchParams }) => <Login searchParams={searchParams} />,
  },
  "account/register": { metadata: page("Create an account"), render: () => <Register /> },
  "account/subscription": {
    metadata: page("Your subscription"),
    render: ({ searchParams }) => <SubscriptionByToken searchParams={searchParams} />,
  },
  terms: { metadata: page("Terms of Sale and Use"), render: () => <Terms /> },
  privacy: { metadata: page("Privacy Policy"), render: () => <Privacy /> },
  "shipping-returns": { metadata: page("Shipping & Returns"), render: () => <ShippingReturns /> },
  "subscription-terms": { metadata: page("Subscription Terms"), render: () => <SubscriptionTerms /> },
};

export const front: StoreFront = {
  htmlClassName: fontVariables,
  lang: "en",
  Layout,
  NotFound,
  metadata: {
    title: "FIRST DRAW | Colostrum for the modern morning",
    description:
      "Grass-fed bovine colostrum with the number printed on the jar: 575 mg of IgG per serving, one origin, a test report for every lot.",
    robots,
  },
  resolve: (segments) => ROUTES[segments.map((s) => decodeURIComponent(s)).join("/")] ?? null,
};
