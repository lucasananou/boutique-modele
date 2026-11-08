import { notFound } from "next/navigation";
import Page from "../Page";
import { loadCatalog, loadProduct } from "../catalog";
import { AC, BandeFinale, Carte, Rituel } from "../blocs";
import { Ajouter, BoutonSon } from "../client";
import { eur } from "../render";

const A = "/stores/monjolibola/img";
const SCENES: Record<string, { src: string; alt: string; ill?: boolean }> = {
  "bola-de-grossesse-fleur-or": { src: `${A}/lin.webp`, alt: "Bola Fleur d’or posé sur du lin" },
  "bola-de-grossesse-arbre-de-vie": { src: `${A}/femme.webp`, alt: "Femme enceinte portant le bola Arbre de vie", ill: true },
  "bola-de-grossesse-etoile": { src: `${A}/paume.webp`, alt: "Bola Étoile posé dans une paume, pour voir sa taille", ill: true },
  "bola-de-grossesse-rosace": { src: `${A}/rituel-macro.webp`, alt: "Bola Rosace suspendu dans la lumière" },
  "bola-de-grossesse-rond-or": { src: `${A}/rituel.webp`, alt: "Femme enceinte à la fenêtre portant le bola Rond d’or", ill: true },
};

export default async function ProductPage({ slug }: { slug: string }) {
  const [catalog, item] = await Promise.all([loadCatalog(), loadProduct(slug)]);
  if (!item) notFound();
  const proches = catalog.items.filter((i) => i.famille === item.famille && i.slug !== item.slug).slice(0, 4);
  const scene = SCENES[slug];
  return (
    <Page>
      <div className="pile">
        <section className="fiche"><div className="fiche__in">
          <div className="fiche__gal"><img className="leve" src={item.img} alt={`Bola ${item.nom}, photo produit`} width={900} height={900} fetchPriority="high" />{scene && <figure><img src={scene.src} alt={scene.alt} loading="lazy" />{scene.ill && <figcaption>Image d’illustration</figcaption>}</figure>}</div>
          <div className="fiche__inf">
            <p className="sur leve"><a href="/boutique">La collection</a> · {item.familleNom}</p>
            <h1 className="leve">Bola <em>{item.nom}</em></h1>
            <p className="fiche__d leve l1">{item.description}</p>
            <p className="fiche__p leve l1">{eur(item.price)}</p>
            {proches.length > 0 && <div className="fiche__v leve l2"><p>Dans les mêmes couleurs</p><div>{proches.map((p) => <a key={p.slug} href={`/produit/${p.slug}`} aria-label={`Bola ${p.nom}`}><img src={p.img} alt="" width={64} height={64} loading="lazy" /></a>)}</div></div>}
            <div className="fiche__a leve l2"><Ajouter disponible={item.available} ligne={{ productId: item.productId, slug: item.slug, variantId: item.variantId, name: item.name, size: item.variantLabel, unitPrice: item.price, img: item.img }} /><BoutonSon /></div>
            <details open><summary>Matière et dimensions<span>+</span></summary><p><AC>Matière, diamètre et longueur de chaîne à confirmer avant publication.</AC></p></details>
            <details><summary>Livraison et retours<span>+</span></summary><p>Droit de rétractation légal de 14 jours. <AC>Délais et frais à confirmer.</AC></p></details>
            <details><summary>Précaution<span>+</span></summary><p>Ce bijou contient de petites pièces. Gardez-le hors de portée d’un bébé.</p></details>
          </div>
        </div></section>
        <Rituel />
        {proches.length > 0 && <section className="proches"><h2>Dans les mêmes <em>couleurs</em></h2><div className="grille">{proches.map((p) => <Carte key={p.slug} item={p} />)}</div></section>}
        <BandeFinale />
      </div>
    </Page>
  );
}
