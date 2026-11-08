import Page from "../Page";
import type { Catalog } from "../catalog";
import type { SearchParams } from "@/stores/front";
import { BandeFinale, Carte } from "../blocs";

const FAMILLES = [["clairs", "Clairs"], ["rouges-et-roses", "Rouges et roses"], ["verts", "Verts"], ["bleus", "Bleus"], ["argentes", "Argentés"]];
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default function Boutique({ catalog, searchParams }: { catalog: Catalog; searchParams: SearchParams }) {
  const f = one(searchParams.couleur);
  const items = FAMILLES.some(([id]) => id === f) ? catalog.items.filter((i) => i.famille === f) : catalog.items;
  return (
    <Page>
      <div className="liste">
        <header><p className="sur leve">La collection</p><h1 className="leve">Nos <em>bolas</em></h1></header>
        <nav className="liste__f" aria-label="Filtrer par couleur"><a href="/boutique" aria-current={!f ? "true" : undefined}>Tous</a>{FAMILLES.map(([id, n]) => <a key={id} href={`/boutique?couleur=${id}`} aria-current={f === id ? "true" : undefined}>{n}</a>)}</nav>
        <div className="grille">{items.map((i) => <Carte key={i.slug} item={i} />)}</div>
      </div>
      <BandeFinale />
    </Page>
  );
}
