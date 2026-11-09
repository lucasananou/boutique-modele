import Page from "../Page";
import type { Catalog } from "../catalog";
import { BandeFinale, Carte, Rituel, Tuiles } from "../blocs";
import { loadCollections, tuilesCouleur } from "../collections";

const A = "/stores/monjolibola/img";
const GUIDES = [
  ["/bola-de-grossesse", "Tout savoir sur le bola de grossesse"],
  ["/guide/comment-choisir-son-bola-de-grossesse", "Comment choisir son bola"],
  ["/guide/offrir-un-bola-de-grossesse", "Offrir un bola"],
];

export default async function Home({ catalog }: { catalog: Catalog }) {
  const collections = await loadCollections(catalog);
  const marques = catalog.items.filter((i) => i.iconic);
  const selection = (marques.length >= 4 ? marques : catalog.items).slice(0, 4);
  const grille = catalog.items.filter((i) => !selection.includes(i)).slice(0, 8);
  return (
    <Page>
      <div className="pile">
        <section className="hero">
          <picture><source media="(min-width: 768px)" srcSet={`${A}/hero.webp`} /><img className="hero__img" src={`${A}/hero-m.webp`} alt="Femme enceinte en robe bordeaux et gilet crème, portant un bola, dans la lumière d’une fenêtre" fetchPriority="high" /></picture>
          <span className="hero__leg">Image d’illustration</span>
          <div className="hero__txt"><h1 className="leve">Le bola,<br />un bijou qui<br />tisse déjà un <em>lien</em>.</h1>
            <p className="leve l1">Bien plus qu’un accessoire de grossesse, le bola est un bijou délicat et symbolique, qui accompagne la rencontre entre vous et votre bébé.</p>
            <div className="leve l2 boutons"><a className="btn btn--plein" href="/boutique">Voir tous les bolas</a><a className="btn btn--ligne" href="/collections">Les collections</a></div></div>
        </section>

        <section className="rayon">
          <header className="rayon__tete"><h2>Notre <em>sélection</em></h2><a href="/boutique">Voir tous les bolas</a></header>
          <div className="grille">{selection.map((i) => <Carte key={i.slug} item={i} />)}</div>
        </section>

        <section className="rayon rayon--creme"><div className="rayon__in">
          <header className="rayon__tete"><h2>Nos <em>collections</em></h2><a href="/collections">Toutes les collections</a></header>
          <Tuiles tuiles={[...collections, ...tuilesCouleur(catalog)]} />
        </div></section>

        <section className="presence">
          <div className="presence__img"><img src={`${A}/lin.webp`} alt="Bola Fleur dorée posé sur du lin ivoire" loading="lazy" /></div>
          <div className="presence__txt rv"><h2>Plus qu’un bijou,<br />une <em>présence</em>.</h2><p>Un tintement doux, presque secret, qui accompagne vos jours et ponctue ces mois d’attente, bien avant la première rencontre.</p><span className="filet" /></div>
        </section>

        {grille.length > 0 && <section className="rayon">
          <header className="rayon__tete"><h2>D’autres <em>modèles</em></h2></header>
          <div className="grille">{grille.map((i) => <Carte key={i.slug} item={i} />)}</div>
          <p className="liste__tous"><a className="btn btn--plein" href="/boutique">Voir tous les bolas</a></p>
        </section>}

        <Rituel />

        <section className="guides-acc"><p className="sur">Nos guides</p><h2>Bien choisir, bien <em>porter</em>.</h2><nav>{GUIDES.map(([h, t]) => <a key={h} href={h}>{t}</a>)}<a href="/guide">Tous les guides</a></nav></section>

        <BandeFinale />
      </div>
    </Page>
  );
}
