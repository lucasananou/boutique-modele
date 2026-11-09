import type { CatalogItem } from "./catalog";
import { eur } from "./render";
import { AjoutRapide } from "./client";
import type { Tuile } from "./collections";

const A = "/stores/monjolibola/img";
export const AC = ({ children }: { children: React.ReactNode }) => <span className="ac">{children}</span>;

export function Carte({ item }: { item: CatalogItem }) {
  return (
    <article className="carte">
      <a className="carte__img" href={`/produit/${item.slug}`}><img src={item.img} alt={`Bola ${item.nom}`} width={800} height={800} loading="lazy" decoding="async" /></a>
      <h3><a href={`/produit/${item.slug}`}>{item.nom}</a></h3>
      <p>{eur(item.price)}</p>
      {item.available && <AjoutRapide ligne={{ productId: item.productId, slug: item.slug, variantId: item.variantId, name: item.name, size: item.variantLabel, unitPrice: item.price, img: item.img }} />}
    </article>
  );
}

export function Tuiles({ tuiles }: { tuiles: Tuile[] }) {
  return (
    <div className="tuiles">
      {tuiles.map((t) => (
        <a key={t.href} className="tuile" href={t.href}>
          <img src={t.img} alt={t.alt} width={800} height={600} loading="lazy" decoding="async" />
          <span className="tuile__t"><b>{t.nom}</b><small>{t.nombre} modèle{t.nombre > 1 ? "s" : ""}</small></span>
        </a>
      ))}
    </div>
  );
}

export function Rituel() {
  return (
    <section className="rituel">
      <figure><img src={`${A}/rituel.webp`} alt="Femme enceinte à la fenêtre, main posée sur le ventre, portant un bola" loading="lazy" /><figcaption>Image d’illustration</figcaption></figure>
      <div className="rituel__macro"><img src={`${A}/rituel-macro.webp`} alt="Bola Rosace suspendu à une chaîne fine, dans la lumière" loading="lazy" /></div>
      <div className="rituel__txt rv"><p className="sur">Le rituel</p><h2>Un son doux,<br />une histoire à <em>deux</em>.</h2>
        <p>Au fil de la grossesse, le tintement du bola devient un repère, un rituel intime, un moment rien qu’à vous.</p>
        <p>Un geste que l’on refait sans y penser, et un souvenir à garder bien après la naissance.</p><span className="filet" /></div>
    </section>
  );
}

export function BandeFinale() {
  return <section className="bande"><h2>Trouvez le bola qui vous accompagnera</h2><a className="btn btn--clair" href="/boutique">Découvrir la collection →</a></section>;
}
