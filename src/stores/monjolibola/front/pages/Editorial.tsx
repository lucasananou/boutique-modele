import Page from "../Page";
import { AC, BandeFinale, Rituel } from "../blocs";
import { BoutonSon } from "../client";

const A = "/stores/monjolibola/img";
const TRAME = [["Qui", "Le prénom de la personne derrière la marque, et une vraie photo."], ["Pourquoi", "Ce qui a réellement donné envie de lancer Mon Joli Bola."], ["Quand", "La vraie date de lancement. Le domaine existe depuis 2019."], ["D’où", "Le fournisseur ou l’atelier réel, et ce qui est contrôlé avant l’envoi."]];

export function Concept() {
  return (
    <Page><div className="pile">
      <section className="edito"><div className="edito__txt"><p className="sur leve">L’univers</p><h1 className="leve">Le bola, en quelques <em>mots</em></h1><p className="leve l1">Un pendentif rond, une petite bille à l’intérieur, une chaîne longue. Vous bougez, il tinte.</p><div className="boutons leve l2"><a className="btn btn--plein" href="/boutique">Découvrir nos bolas</a><BoutonSon /></div></div><figure><img src={`${A}/femme.webp`} alt="Femme enceinte portant un bola vert" fetchPriority="high" /><figcaption>Image d’illustration</figcaption></figure></section>
      <section className="centre rv"><h2>D’où <em>vient</em>-il ?</h2><p>On l’associe souvent à des traditions d’Amérique centrale et d’Indonésie, sous le nom de « clochette des anges ». Aujourd’hui, on le choisit surtout pour sa beauté, et pour ce petit son qui accompagne la grossesse.</p><p><strong>C’est un bijou : il ne soigne rien et ne promet rien.</strong></p><p><a href="/histoire">Notre histoire</a></p></section>
      <Rituel /><BandeFinale />
    </div></Page>
  );
}
export function Histoire() {
  return (
    <Page><div className="pile">
      <section className="edito"><div className="edito__txt"><p className="sur leve">L’univers</p><h1 className="leve">Notre <em>histoire</em></h1><p className="leve l1">Cette page attend un récit vrai, pas un récit écrit pour l’occasion.</p><span className="filet" /></div><figure><img src={`${A}/rituel.webp`} alt="Femme enceinte à la fenêtre" fetchPriority="high" /><figcaption>Image d’illustration</figcaption></figure></section>
      <section className="trame">{TRAME.map(([t, d]) => <div className="rv" key={t}><h2><em>{t}</em></h2><p>{d}</p><span className="filet" /></div>)}<p><AC>À compléter par Lucas.</AC></p></section>
      <BandeFinale />
    </div></Page>
  );
}
const Q: [string, string, React.ReactNode][] = [
  ["Le porter", "Qu’est-ce qu’un bola ?", "Un pendentif rond qui contient une petite bille. Porté sur une chaîne longue, il tinte doucement quand vous bougez."],
  ["Le porter", "À partir de quand le porter ?", "Quand vous en avez envie. Il n’y a pas de date à respecter, et rien ne vous empêche de le porter après la naissance."],
  ["Le porter", "Mon bébé va-t-il l’entendre ?", "Nous ne promettons rien sur ce point. Le bola est un bijou, pas un soin : vous, vous l’entendrez."],
  ["Le porter", "Peut-on le laisser près de bébé ?", "Non. C’est un petit objet avec une chaîne : gardez-le hors de portée d’un bébé, et jamais dans un lit ou un doudou."],
  ["Le choisir", "En quelle matière est-il ?", <AC key="m">Matière exacte à confirmer avec le fournisseur avant publication.</AC>],
  ["Le choisir", "Quelle taille fait-il ?", <AC key="t">Diamètre et longueur de chaîne à confirmer.</AC>],
  ["Le recevoir", "Quels sont les délais de livraison ?", <AC key="d">Délais et transporteur à confirmer selon qui expédie.</AC>],
  ["Le recevoir", "Puis-je le retourner ?", <span key="r">Vous disposez du droit de rétractation légal de 14 jours. <AC>Conditions complètes à confirmer.</AC></span>],
];
export function Faq() {
  return (
    <Page>
      <div className="questions"><h1 className="leve">Vos <em>questions</em></h1>{[...new Set(Q.map((q) => q[0]))].map((t) => <section key={t}><p className="sur">{t}</p>{Q.filter((q) => q[0] === t).map(([, q, r]) => <details key={q}><summary>{q}<span>+</span></summary><p>{r}</p></details>)}</section>)}<p className="questions__c">Une question ? <AC>Adresse de contact à confirmer.</AC></p></div>
      <BandeFinale />
    </Page>
  );
}
