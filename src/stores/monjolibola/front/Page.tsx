import type { ReactNode } from "react";
import { Anim, PanierBouton, Tiroir } from "./client";
import { commandesOuvertes } from "./catalog";

const A = "/stores/monjolibola";
const V = "2";
const NAV = [["/boutique", "Boutique"], ["/collections", "Collections"], ["/guide", "Guides"], ["/concept", "L’univers"]];

const Sprite = () => (
  <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
    <symbol id="i-sac" viewBox="0 0 256 256"><path d="M216 64h-40a48 48 0 0 0-96 0H40a16 16 0 0 0-16 16v120a16 16 0 0 0 16 16h176a16 16 0 0 0 16-16V80a16 16 0 0 0-16-16ZM128 32a32 32 0 0 1 32 32H96a32 32 0 0 1 32-32Zm88 168H40V80h40v16a8 8 0 0 0 16 0V80h64v16a8 8 0 0 0 16 0V80h40Z" /></symbol>
  </svg>
);

export function Head() {
  return (
    <>
      <link rel="preload" href={`${A}/fonts/newsreader.woff2`} as="font" type="font/woff2" crossOrigin="anonymous" />
      <link rel="stylesheet" href={`${A}/style.css?v=${V}`} precedence="mjb" />
      <link rel="stylesheet" href={`${A}/boutique.css?v=${V}`} precedence="mjb" />
    </>
  );
}

export default function Page({ children }: { children: ReactNode }) {
  const ouvertes = commandesOuvertes();
  return (
    <div className="site">
      <Head />
      <Sprite />
      <a className="skip" href="#contenu">Aller au contenu</a>
      {!ouvertes && <p className="annonce">Boutique bientôt de retour, commandes fermées</p>}
      <header className="entete">
        <div className="entete__in">
          <div className="entete__g"><a className="logo" href="/">Mon Joli Bola</a>
            <nav className="nav">{NAV.map(([h, t]) => <a key={h} href={h}>{t}</a>)}</nav></div>
          <div className="entete__d">
            <a className="lien-compte" href="/compte">Compte</a>
            <PanierBouton />
            <details className="burger"><summary aria-label="Menu"><span /><span /><span /></summary><nav>{NAV.map(([h, t]) => <a key={h} href={h}>{t}</a>)}<a href="/compte">Compte</a></nav></details>
          </div>
        </div>
      </header>
      <main id="contenu">{children}</main>
      <footer className="pied">
        <div className="pied__in">
          <span className="logo logo--p">Mon Joli Bola</span>
          <nav><a href="/bola-de-grossesse">Le bola de grossesse</a><a href="/boutique">Nos bolas</a><a href="/guide">Guides</a><a href="/collections">Collections</a><a href="/concept">L’univers</a><a href="/histoire">Notre histoire</a><a href="/faq">Contact</a></nav>
        </div>
        <nav className="pied__legal"><a href="/mentions-legales">Mentions légales</a><a href="/cgv">Conditions de vente</a><a href="/confidentialite">Confidentialité</a><a href="/retractation">Rétractation</a></nav>
        <p className="pied__note">Les mises en scène sont des images d’illustration : les personnes qui y figurent ne sont pas des clientes.</p>
      </footer>
      <Tiroir ouvertes={ouvertes} />
      <Anim />
    </div>
  );
}
