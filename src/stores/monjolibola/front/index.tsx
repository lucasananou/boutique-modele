import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import type { FrontRoute, StoreFront } from "@/stores/front";
import { store } from "@/stores";
import { loadCatalog } from "./catalog";
import Page from "./Page";
import { NOMS } from "./noms";
import Home from "./pages/Home";
import ProductPage from "./pages/Product";
import Boutique from "./pages/Boutique";
import { Commande, Confirmation, Panier } from "./pages/Shop";
import { AccountHome, Login, Register, SubscriptionByToken } from "./pages/Account";
import { Concept, Faq, Histoire } from "./pages/Editorial";
import { COLLECTIONS_META, CollectionPage, CollectionsIndex, collectionMetadata } from "./pages/Collections";
import { Cgv, Confidentialite, Mentions, Retractation } from "./pages/Legal";
import { GUIDES_INDEX_META, GuidePage, GuidesIndex, guideMetadata } from "./pages/Guides";

/* Vitrine Mon Joli Bola : maquette crème et bordeaux de Lucas, branchée sur le modèle (catalogue, comptes, admin). */

// INDEXER=1 uniquement après la bascule sur mon-joli-bola.fr.
const robots: Metadata["robots"] = process.env.INDEXER === "1" ? { index: true, follow: true } : { index: false, follow: false, nocache: true };
const NAME = "Mon Joli Bola";
const page = (title: string): Metadata => ({ title: `${title} · ${NAME}`, robots });

function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

async function NotFound() {
  return (
    <Page>
      <section className="shop-page">
        <p className="sur">Introuvable</p>
        <h1 className="h2">Cette page n’existe pas.</h1>
        <p className="shop-page__intro">Le lien est peut-être ancien.</p>
        <a className="btn btn--plein" href="/">Retour à l’accueil</a>
      </section>
    </Page>
  );
}

const withCatalog = async (render: (c: Awaited<ReturnType<typeof loadCatalog>>) => ReactNode) => {
  const catalog = await loadCatalog();
  if (catalog.items.length === 0) notFound();
  return render(catalog);
};

const ROUTES: Record<string, FrontRoute> = {
  "": {
    metadata: { title: "Mon Joli Bola, le bola de grossesse", description: store.brand.manifesto, robots },
    render: () => withCatalog((c) => <Home catalog={c} />),
  },
  boutique: {
    metadata: page("Nos bolas"),
    render: ({ searchParams }) => withCatalog((c) => <Boutique catalog={c} searchParams={searchParams} />),
  },
  collections: { metadata: COLLECTIONS_META, render: () => <CollectionsIndex /> },
  concept: { metadata: page("L’univers"), render: () => <Concept /> },
  histoire: { metadata: page("Notre histoire"), render: () => <Histoire /> },
  faq: { metadata: page("Questions"), render: () => <Faq /> },
  guide: { metadata: GUIDES_INDEX_META, render: () => <GuidesIndex /> },
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
    title: "Mon Joli Bola",
    description: store.brand.manifesto,
    icons: "/stores/monjolibola/favicon.svg",
    other: { "theme-color": "#F6EFE5" },
    robots,
  },
  resolve: (segments) => {
    const parts = segments.map((s) => decodeURIComponent(s));
    if (parts.length === 2 && parts[0] === "produit") {
      const slug = parts[1];
      return {
        metadata: { title: `${NOMS[slug] ?? "Bola"} · ${NAME}`, description: store.brand.manifesto, robots },
        render: () => <ProductPage slug={slug} />,
      };
    }
    const chemin = parts.join("/");
    if (parts[0] === "collections" && parts.length === 2) {
      return { metadata: collectionMetadata(parts[1]), render: () => <CollectionPage slug={parts[1]} /> };
    }
    if ((parts[0] === "guide" && parts.length === 2) || (parts[0] === "bola-de-grossesse" && parts.length <= 2)) {
      return { metadata: guideMetadata(chemin), render: () => <GuidePage slug={chemin} /> };
    }
    return ROUTES[chemin] ?? null;
  },
};

