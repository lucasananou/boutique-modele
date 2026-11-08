import Page from "../Page";
import type { Catalog } from "../catalog";
import type { SearchParams } from "@/stores/front";
import { esc, eur } from "../render";

const IMAGES: Record<string, string> = {
  ceremonie: "prod-ceremonie",
  vanille: "prod-vanille",
  fraise: "prod-fraise",
  yuzu: "prod-yuzu",
  hojicha: "tuile-hojicha",
};
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Catalogue complet : tous les produits actifs, recherche simple sur le nom. */
export default function Boutique({ catalog, searchParams }: { catalog: Catalog; searchParams: SearchParams }) {
  const q = one(searchParams.q).trim().toLowerCase();
  const items = q ? catalog.items.filter((i) => i.name.toLowerCase().includes(q)) : catalog.items;
  const cards = items
    .map((i) => {
      const img = `/stores/aoyuki/img/${IMAGES[i.handle] ?? `canette-${i.handle}`}.webp`;
      return `<article class="pr" data-product="${esc(i.handle)}"><a class="pr__media" href="/produit/${esc(i.slug)}" aria-label="Voir ${esc(i.name)}"><img src="${img}" width="900" height="1125" loading="lazy" alt="${esc(i.name)}"></a><div class="pr__row"><h3 class="pr__name"><a href="/produit/${esc(i.slug)}">${esc(i.name)}</a></h3><p class="pr__price">${eur(i.price)}<span>${esc(i.variants[0]?.label ?? "")}</span></p></div><button class="btn btn--line pr__add" type="button" data-add aria-label="Ajouter ${esc(i.name)} au panier">Ajouter</button></article>`;
    })
    .join("");
  const html = `<section class="produits" aria-labelledby="catalogue-titre"><div class="wrap">
    <header class="produits__head"><p class="eyebrow">La boutique</p><h1 id="catalogue-titre" class="h2">Tous nos thés<span class="dot">.</span></h1></header>
    <form class="shop-search" action="/boutique" method="get" role="search"><label class="sr" for="q">Rechercher un produit</label><input id="q" class="shop-input" name="q" type="search" placeholder="Rechercher un thé" value="${esc(q)}"><button class="btn btn--line" type="submit">Rechercher</button></form>
    ${items.length ? `<div class="pr-list">${cards}</div>` : `<p class="produits__note">Aucun résultat pour cette recherche.</p>`}
  </div></section>`;
  return <Page catalog={catalog} html={html} />;
}
