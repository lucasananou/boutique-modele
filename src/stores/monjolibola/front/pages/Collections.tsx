import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { store } from "@/stores";
import Page from "../Page";
import { loadCatalog } from "../catalog";
import { loadCollections, tuilesCouleur } from "../collections";
import { BandeFinale, Carte, Tuiles } from "../blocs";

const ORIGIN = `https://${store.domains.primary}`;
const NAME = "Mon Joli Bola";
const robots: Metadata["robots"] = process.env.INDEXER === "1" ? { index: true, follow: true } : { index: false, follow: false, nocache: true };
const ld = (o: unknown) => JSON.stringify(o).replace(/</g, "\\u003c");

export const COLLECTIONS_META: Metadata = {
  title: `Collections de bolas de grossesse · ${NAME}`,
  description: "Nos bolas de grossesse classés par motif et par couleur : fleurs, rosaces, soleils et étoiles, motifs graphiques, couleur dorée ou argentée.",
  alternates: { canonical: `${ORIGIN}/collections` },
  robots,
};

export async function collectionMetadata(slug: string): Promise<Metadata> {
  const catalog = await loadCatalog();
  const c = (await loadCollections(catalog)).find((x) => x.slug === slug);
  if (!c) return { title: NAME, robots };
  const url = `${ORIGIN}${c.href}`;
  return { title: `${c.titre} · ${NAME}`, description: c.description, alternates: { canonical: url }, robots, openGraph: { title: c.titre, description: c.description, url, siteName: NAME, locale: "fr_FR", type: "website", images: c.img ? [{ url: `${ORIGIN}${c.img}` }] : undefined } };
}

export async function CollectionsIndex() {
  const catalog = await loadCatalog();
  const collections = await loadCollections(catalog);
  return (
    <Page>
      <div className="liste">
        <header><p className="sur leve">La boutique</p><h1 className="leve">Nos <em>collections</em></h1></header>
        <Tuiles tuiles={[...collections, ...tuilesCouleur(catalog)]} />
        <p className="liste__tous"><a className="btn btn--ligne" href="/boutique">Voir tous les bolas</a></p>
      </div>
      <BandeFinale />
    </Page>
  );
}

export async function CollectionPage({ slug }: { slug: string }) {
  const catalog = await loadCatalog();
  const collections = await loadCollections(catalog);
  const c = collections.find((x) => x.slug === slug);
  // Anciennes URL /collections/* du site précédent : vers la boutique, comme avant.
  if (!c) permanentRedirect("/boutique");
  const url = `${ORIGIN}${c.href}`;
  const graphe = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "BreadcrumbList", itemListElement: [["Accueil", ORIGIN], ["Collections", `${ORIGIN}/collections`], [c.nom, url]].map(([name, item], i) => ({ "@type": "ListItem", position: i + 1, name, item })) },
      { "@type": "CollectionPage", name: c.titre, description: c.description, url, inLanguage: "fr-FR" },
      { "@type": "ItemList", itemListElement: c.items.map((i, n) => ({ "@type": "ListItem", position: n + 1, name: i.name, url: `${ORIGIN}/produit/${i.slug}` })) },
    ],
  };
  return (
    <Page>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld(graphe) }} />
      <div className="liste">
        <nav className="liste__fil" aria-label="Fil d’Ariane"><a href="/">Accueil</a> / <a href="/collections">Collections</a> / <span aria-current="page">{c.nom}</span></nav>
        <header><h1 className="leve">{c.titre}</h1><p className="liste__intro leve l1">{c.description}</p></header>
        <nav className="liste__f" aria-label="Autres collections"><a href="/boutique">Tous</a>{collections.map((x) => <a key={x.slug} href={x.href} aria-current={x.slug === c.slug ? "true" : undefined}>{x.nom}</a>)}{tuilesCouleur(catalog).map((t) => <a key={t.href} href={t.href}>{t.nom}</a>)}</nav>
        <p className="liste__n">{c.nombre} modèle{c.nombre > 1 ? "s" : ""}</p>
        <div className="grille grille--serree">{c.items.map((i) => <Carte key={i.slug} item={i} />)}</div>
        <p className="liste__tous"><a className="btn btn--ligne" href="/boutique">Voir tous les bolas</a></p>
      </div>
      <BandeFinale />
    </Page>
  );
}
