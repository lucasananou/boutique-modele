import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import type { FrontRoute, StoreFront } from "@/stores/front";
import { store } from "@/stores";
import { loadCatalog } from "./catalog";
import Page from "./Page";
import Home from "./pages/Home";
import ProductPage from "./pages/Product";
import Boutique from "./pages/Boutique";
import { Commande, Confirmation, Panier } from "./pages/Shop";
import { AccountHome, Login, Register, SubscriptionByToken } from "./pages/Account";
import { Cgv, Confidentialite, Mentions, Retractation } from "./pages/Legal";

/*
 * Vitrine Aoyuki : la maquette validée (accueil + fiche Cérémonie) servie à
 * l'identique, branchée sur le modèle (catalogue en base, /api/checkout,
 * comptes, e-mails, admin). Voir src/stores/front.ts.
 */

// Tant que Lucas n'a pas ouvert la boutique : aucune page indexable.
const robots: Metadata["robots"] = { index: false, follow: false, nocache: true };
const NAME = "Aoyuki";
const page = (title: string): Metadata => ({ title: `${title} · ${NAME}`, robots });

function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

async function NotFound() {
  const catalog = await loadCatalog();
  return (
    <Page catalog={catalog}>
      <section className="shop-page">
        <p className="eyebrow">Introuvable</p>
        <h1 className="h2">Cette page n’existe pas<span className="dot">.</span></h1>
        <p className="shop-page__intro">Le lien est peut-être ancien.</p>
        <a className="btn btn--sapin" href="/">Retour à l’accueil</a>
      </section>
    </Page>
  );
}

const withCatalog = async (render: (c: Awaited<ReturnType<typeof loadCatalog>>) => ReactNode) => {
  const catalog = await loadCatalog();
  if (catalog.items.length === 0) notFound();
  return render(catalog);
};

const TITLES: Record<string, string> = {
  "matcha-ceremonie": "Matcha Cérémonie",
  "latte-vanille": "Matcha latte Vanille",
  "latte-fraise": "Matcha latte Fraise",
  "latte-yuzu": "Matcha latte Yuzu",
  hojicha: "Hojicha",
};

const ROUTES: Record<string, FrontRoute> = {
  "": {
    metadata: { title: "Aoyuki · Matcha & Hojicha du Japon", description: store.brand.manifesto, robots },
    render: () => withCatalog((c) => <Home catalog={c} />),
  },
  boutique: {
    metadata: page("Boutique"),
    render: ({ searchParams }) => withCatalog((c) => <Boutique catalog={c} searchParams={searchParams} />),
  },
  panier: { metadata: page("Panier"), render: () => <Panier /> },
  commande: { metadata: page("Commande"), render: () => <Commande /> },
  "commande/confirmation": {
    metadata: page("Confirmation"),
    render: ({ searchParams }) => <Confirmation searchParams={searchParams} />,
  },
  compte: { metadata: page("Mon compte"), render: () => <AccountHome /> },
  "compte/connexion": { metadata: page("Connexion"), render: ({ searchParams }) => <Login searchParams={searchParams} /> },
  "compte/inscription": { metadata: page("Inscription"), render: () => <Register /> },
  "compte/abonnement": {
    metadata: page("Mon abonnement"),
    render: ({ searchParams }) => <SubscriptionByToken searchParams={searchParams} />,
  },
  "mentions-legales": { metadata: page("Mentions légales"), render: () => <Mentions /> },
  cgv: { metadata: page("Conditions de vente"), render: () => <Cgv /> },
  confidentialite: { metadata: page("Confidentialité"), render: () => <Confidentialite /> },
  retractation: { metadata: page("Rétractation et retours"), render: () => <Retractation /> },
};

export const front: StoreFront = {
  htmlClassName: "",
  lang: "fr",
  Layout,
  NotFound,
  metadata: {
    title: "Aoyuki · Matcha & Hojicha du Japon",
    description: store.brand.manifesto,
    icons: "/stores/aoyuki/favicon.svg",
    other: { "theme-color": "#102F23" },
    robots,
  },
  resolve: (segments) => {
    const parts = segments.map((s) => decodeURIComponent(s));
    if (parts.length === 2 && parts[0] === "produit") {
      const slug = parts[1];
      return {
        metadata: { title: `${TITLES[slug] ?? "Produit"} · ${NAME}`, description: store.brand.manifesto, robots },
        render: () => <ProductPage slug={slug} />,
      };
    }
    return ROUTES[parts.join("/")] ?? null;
  },
};

