"use client";

import { useEffect, useRef, useState } from "react";
import { addLine, CART_EVENT, cartTotals, eur, readCart, removeLine, setQuantity, type CartLine } from "./cart";

const OUVRIR = "monjolibola:ouvrir";
const A = "/stores/monjolibola";
export type LigneAjout = { productId: string; slug: string; variantId: string; name: string; size: string; unitPrice: number; img: string };

function usePanier() {
  const [lines, setLines] = useState<CartLine[]>([]);
  useEffect(() => {
    const sync = () => setLines(readCart());
    sync();
    window.addEventListener(CART_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(CART_EVENT, sync); window.removeEventListener("storage", sync); };
  }, []);
  return lines;
}

export function PanierBouton() {
  const lines = usePanier();
  const n = lines.reduce((s, l) => s + l.quantity, 0);
  return (
    <button type="button" className="ico" aria-label={`Panier, ${n} article(s)`} onClick={() => window.dispatchEvent(new Event(OUVRIR))}>
      <svg aria-hidden width="20" height="20" viewBox="0 0 256 256" fill="currentColor"><use href="#i-sac" /></svg>
      {n > 0 && <span className="ico__n">{n}</span>}
    </button>
  );
}

export function Tiroir({ ouvertes }: { ouvertes: boolean }) {
  const [open, setOpen] = useState(false);
  const lines = usePanier();
  useEffect(() => { const f = () => setOpen(true); window.addEventListener(OUVRIR, f); return () => window.removeEventListener(OUVRIR, f); }, []);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);
  const t = cartTotals(lines);
  return (
    <div className={`tiroir${open ? " est-ouvert" : ""}`} aria-hidden={!open}>
      <button type="button" className="tiroir__fond" aria-label="Fermer le panier" tabIndex={open ? 0 : -1} onClick={() => setOpen(false)} />
      <aside className="tiroir__panneau" role="dialog" aria-label="Panier">
        <div className="tiroir__tete"><h2>Votre panier</h2><button type="button" className="ico" aria-label="Fermer" tabIndex={open ? 0 : -1} onClick={() => setOpen(false)}>×</button></div>
        <div className="tiroir__corps">
          {lines.length === 0 ? <p className="tiroir__vide">Votre panier est vide.<br /><a href="/boutique" tabIndex={open ? 0 : -1}>Voir nos bolas</a></p> : lines.map((l) => (
            <div className="tiroir__ligne" key={l.key}>
              <img src={l.img} alt="" width={72} height={72} />
              <div><a className="titre" href={`/produit/${l.slug}`}>{l.name}</a><p>{eur(l.unitPrice)}</p>
                <div className="qte"><button type="button" aria-label="Retirer un" onClick={() => setQuantity(l.key, l.quantity - 1)}>−</button><span>{l.quantity}</span><button type="button" aria-label="Ajouter un" onClick={() => setQuantity(l.key, l.quantity + 1)}>+</button><button type="button" className="text-link" onClick={() => removeLine(l.key)}>Retirer</button></div></div>
            </div>
          ))}
        </div>
        <div className="tiroir__pied">
          <div className="sum-total grand"><span>Total</span><span>{eur(t.total)}</span></div>
          {ouvertes ? <a className="btn btn--plein btn--wide" href="/commande">Commander</a> : <p className="demo-note">Les commandes sont fermées pour le moment.</p>}
        </div>
      </aside>
    </div>
  );
}

export function Ajouter({ ligne, disponible }: { ligne: LigneAjout; disponible: boolean }) {
  if (!disponible) return <button type="button" className="btn btn--plein btn--wide" disabled>Commandes fermées</button>;
  return (
    <button type="button" className="btn btn--plein btn--wide" onClick={() => { addLine({ handle: ligne.slug, ...ligne }); window.dispatchEvent(new Event(OUVRIR)); }}>
      Ajouter au panier · {eur(ligne.unitPrice)}
    </button>
  );
}

export function BoutonSon() {
  const [joue, setJoue] = useState(false);
  const a = useRef<HTMLAudioElement | null>(null);
  useEffect(() => () => a.current?.pause(), []);
  const basculer = () => {
    if (!a.current) { a.current = new Audio(`${A}/apercu.mp3`); a.current.onended = () => setJoue(false); }
    if (joue) { a.current.pause(); a.current.currentTime = 0; setJoue(false); } else { a.current.play().catch(() => setJoue(false)); setJoue(true); }
  };
  return <button type="button" className="btn btn--ligne btn--wide" aria-pressed={joue} onClick={basculer}>{joue ? "Arrêter" : "Écouter un tintement"}</button>;
}

/** Apparition au défilement des éléments .rv. */
export function Anim() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".rv");
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("vu"); io.unobserve(e.target); } }), { threshold: 0.12 });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
  return null;
}
