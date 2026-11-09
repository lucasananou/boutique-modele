import Page from "../Page";
import type { Catalog } from "../catalog";
import { showExamples } from "../catalog";
import { AC, BandeFinale, Rituel } from "../blocs";
import { eur } from "../render";

const A = "/stores/monjolibola/img";
const TROIS = [["bola-de-grossesse-fleur-doree", "31%"], ["bola-de-grossesse-fleur-argentee", "50%"], ["bola-de-grossesse-rond-dore", "68%"]];
const AVIS = [["Un bijou sublime, rempli de sens. Je ne le quitte plus.", "Élise"], ["Un son si doux et apaisant… Un vrai coup de cœur.", "Camille"]];

export default function Home({ catalog }: { catalog: Catalog }) {
  return (
    <Page>
      <div className="pile">
        <section className="hero">
          <picture><source media="(min-width: 768px)" srcSet={`${A}/hero.webp`} /><img className="hero__img" src={`${A}/hero-m.webp`} alt="Femme enceinte en robe bordeaux et gilet crème, portant un bola, dans la lumière d’une fenêtre" fetchPriority="high" /></picture>
          <span className="hero__leg">Image d’illustration</span>
          <div className="hero__txt"><h1 className="leve">Le bola,<br />un bijou qui<br />tisse déjà un <em>lien</em>.</h1>
            <p className="leve l1">Bien plus qu’un accessoire de grossesse, le bola est un bijou délicat et symbolique, qui accompagne la rencontre entre vous et votre bébé.</p>
            <div className="leve l2 boutons"><a className="btn btn--plein" href="/boutique">Découvrir nos bolas</a><a className="btn btn--ligne" href="/#coffret">Offrir un bola</a></div></div>
        </section>

        <section className="presence">
          <div className="presence__img"><img src={`${A}/lin.webp`} alt="Bola Fleur dorée posé sur du lin ivoire" loading="lazy" /></div>
          <div className="presence__txt rv"><h2>Plus qu’un bijou,<br />une <em>présence</em>.</h2><p>Un tintement doux, presque secret, qui accompagne vos jours et ponctue ces mois d’attente, bien avant la première rencontre.</p><span className="filet" /></div>
        </section>

        <section className="collection"><div className="collection__in">
          <img src={`${A}/collection.webp`} alt="Trois bolas sur un mur crème" loading="lazy" />
          <div className="collection__tete"><p className="sur">La collection</p><h2>Nos bolas emblématiques</h2></div>
          {TROIS.map(([slug, x]) => { const i = catalog.byHandle[slug]; return i ? <a key={slug} className="collection__nom" style={{ left: x }} href={`/produit/${slug}`}><span>{i.nom}</span><small>{eur(i.price)}</small></a> : null; })}
        </div></section>

        <Rituel />

        {showExamples() && <section className="avis"><p className="avis__note"><AC>Avis d’exemple pour la préproduction, retirés avant toute mise en ligne.</AC></p><div className="avis__g">{AVIS.map(([q, n]) => <figure key={n}><span aria-hidden>“</span><div><blockquote>{q}</blockquote><figcaption>{n}, exemple</figcaption></div></figure>)}</div></section>}

        <section className="coffret" id="coffret">
          <img src={`${A}/coffret.webp`} alt="Coffret cadeau crème Mon Joli Bola noué d’un ruban bordeaux" loading="lazy" />
          <div className="coffret__txt rv"><p className="sur">Le coffret cadeau</p><h2>Un cadeau précieux<br />pour une future maman.</h2><p>Un bijou symbolique, présenté dans un coffret, à offrir pour une grossesse, une naissance ou simplement pour célébrer ce moment. <AC>Coffret à produire.</AC></p><a className="btn btn--plein" href="/boutique">Découvrir le coffret</a></div>
        </section>

        <BandeFinale />
      </div>
    </Page>
  );
}
