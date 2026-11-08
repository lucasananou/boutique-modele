import { notFound } from "next/navigation";
import {
  BUYBAR,
  DRAWER_RETOURS,
  DRAWER_TOUS_AVIS,
  PRODUCT_AFTER_PUSH,
  PRODUCT_ANNOUNCE,
  PRODUCT_CEREMONIE_MID,
  PRODUCT_FOOT,
  PRODUCT_NEWS,
  PRODUCT_PUSH,
  PRODUCT_TOP,
} from "../html.generated";
import Page from "../Page";
import { type Catalog, type CatalogItem, loadCatalog, loadProduct, showExamples } from "../catalog";
import { esc, eur } from "../render";


/** Fiche d'un produit hors Matcha Cérémonie : même composition, contenu lu en base. */
function genericTop(item: CatalogItem, catalog: Catalog): string {
  const p = item.product!;
  const images = p.images.length ? p.images : [{ src: item.img, alt: item.name }];
  const thumbs = images
    .map((im, i) => `<button type="button" data-gal-go="${i}" aria-label="Image ${i + 1} sur ${images.length}"${i === 0 ? ' aria-current="true"' : ""}><img src="${esc(im.src)}" alt="" loading="lazy"></button>`)
    .join("");
  const figures = images
    .map((im, i) => `<figure><img ${i === 0 ? 'data-gal-main fetchpriority="high"' : 'loading="lazy"'} src="${esc(im.src)}" alt="${esc(im.alt)}"></figure>`)
    .join("");
  const dots = images.map((_, i) => `<span${i === 0 ? ' class="is-on"' : ""}></span>`).join("");
  const formats = item.variants
    .map((v, i) => `<label><input type="radio" name="format" value="${esc(v.label)}" data-price="${v.price / 100}" data-grams="${parseInt(v.label, 10) || 0}"${i === 0 ? " checked" : ""}><span><b>${esc(v.label)}</b></span></label>`)
    .join("");
  const sav = ["ceremonie", "vanille", "fraise", "yuzu"]
    .filter((h) => catalog.byHandle[h])
    .map((h) => {
      const it = catalog.byHandle[h];
      const on = h === item.handle;
      return on
        ? `<span class="sav__i is-on" aria-current="true" title="${esc(it.name)}"><img src="${esc(it.img)}" alt="" width="62" height="76" loading="lazy"></span>`
        : `<a class="sav__i" href="/produit/${esc(it.slug)}" aria-label="${esc(it.name)}" title="${esc(it.name)}"><img src="${esc(it.img)}" alt="" width="62" height="76" loading="lazy"></a>`;
    })
    .join("");
  const details = p.details.map((d) => `<h3>${esc(d.label)}</h3><p>${esc(d.value)}</p>`).join("");
  const cross = catalog.items
    .filter((i) => i.handle !== item.handle)
    .slice(0, 3)
    .map(
      (i) =>
        `<li class="cr" data-product="${esc(i.handle)}"><img src="${esc(i.img)}" alt="" width="52" height="64" loading="lazy"><div><p class="cr__n">${esc(i.name)}</p><p class="cr__p">${eur(i.price)}</p></div><button class="btn btn--line" type="button" data-add aria-label="Ajouter ${esc(i.name)} au panier">Ajouter</button></li>`,
    )
    .join("");
  const hasSav = item.handle === "ceremonie" || p.slug.startsWith("latte-");
  return `<div class="wrap pp">
    <div class="pp__gal">
      <div class="gal__thumbs" aria-label="Choisir une image">${thumbs}</div>
      <div class="gal__view"><div class="gal" data-gal tabindex="0" aria-label="Galerie de ${esc(item.name)}">${figures}</div><div class="gal__dots" aria-hidden="true">${dots}</div></div>
    </div>
    <form class="pp__buy" data-pp novalidate data-handle="${esc(item.handle)}">
      <nav class="fil" aria-label="Fil d'Ariane"><a href="/">Accueil</a><span aria-hidden="true">/</span><a href="/#produits">Nos thés</a><span aria-hidden="true">/</span><span aria-current="page">${esc(item.name)}</span></nav>
      <h1 class="pp__title">${esc(item.name)}<span class="dot">.</span></h1>
      <p class="pp__lead">${esc(p.shortDescription)}</p>
      ${hasSav ? `<div class="pp__field"><p class="pp__lab">Saveur <b>${esc(item.name.replace("Matcha latte ", ""))}</b></p><div class="sav">${sav}</div></div>` : ""}
      <fieldset class="pp__field"><legend class="pp__lab">Format</legend><div class="fmt">${formats}</div></fieldset>
      <fieldset class="pp__field"><legend class="sr">Options d’achat</legend>
        <div class="opt">
          <label><input type="radio" name="mode" value="unique" data-off="0" checked><span class="opt__c"><span class="opt__dot" aria-hidden="true"></span><span class="opt__n">Achat unique</span><span class="opt__p"><b data-opt="unique">${eur(item.price)}</b></span></span></label>
          <label><input type="radio" name="mode" value="abo" data-off="10"><span class="opt__c"><span class="opt__dot" aria-hidden="true"></span><span class="opt__n">Abonnement</span><span class="opt__p"><s data-old="abo">${eur(item.price)}</s><b data-opt="abo">${eur(item.subPrice)}</b><small><em>-10 %</em> par canette</small></span></span></label>
        </div>
        <div class="freq" data-pp-freq hidden><p class="freq__label" id="freq-label">Livraison tous les</p><div class="freq__row" role="radiogroup" aria-labelledby="freq-label"><label><input type="radio" name="freq" value="30" checked><span>30 jours</span></label><label><input type="radio" name="freq" value="45"><span>45 jours</span></label><label><input type="radio" name="freq" value="60"><span>60 jours</span></label></div></div>
      </fieldset>
      <div class="pp__cta" data-pp-cta>
        <div class="qty" role="group" aria-label="Quantité"><button type="button" data-qty="-1" aria-label="Retirer une canette">-</button><output data-pp-qty aria-live="polite">1</output><button type="button" data-qty="1" aria-label="Ajouter une canette">+</button></div>
        <button class="btn btn--sapin pp__add" type="submit"><span data-pp-add>Ajouter au panier · ${eur(item.price)}</span></button>
      </div>
      <details class="acc" open><summary>Description</summary><div class="acc__b"><p>${esc(p.description)}</p>${details}</div></details>
      ${cross ? `<details class="acc" open><summary>Produits complémentaires</summary><ul class="acc__b crs">${cross}</ul></details>` : ""}
    </form>
  </div>`;
}

export default async function ProductPage({ slug }: { slug: string }) {
  const [catalog, item] = await Promise.all([loadCatalog(), loadProduct(slug)]);
  if (!item || !item.variants.length) notFound();
  const examples = showExamples();
  const ceremonie = item.handle === "ceremonie";
  const top = ceremonie ? PRODUCT_TOP : genericTop(item, catalog);
  const middle = ceremonie ? PRODUCT_CEREMONIE_MID : "";
  const after = ceremonie ? PRODUCT_AFTER_PUSH : "";
  const html = `${top}${middle}${PRODUCT_PUSH}${after}${PRODUCT_NEWS}`;
  const buybar = ceremonie
    ? BUYBAR
    : BUYBAR.replace("Matcha Cérémonie", esc(item.name)).replace("{{eur:ceremonie}}", eur(item.price)).replace("30 g", esc(item.variants[0].label));
  const extra = `${examples ? DRAWER_TOUS_AVIS : ""}${DRAWER_RETOURS}${buybar}`;
  return <Page catalog={catalog} produit announce={PRODUCT_ANNOUNCE} foot={ceremonie ? PRODUCT_FOOT : PRODUCT_FOOT.replace("<span>Matcha Cérémonie</span>", `<span>${esc(item.name)}</span>`)} extra={extra} html={html} />;
}
