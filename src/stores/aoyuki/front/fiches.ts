import type { Catalog, CatalogItem } from "./catalog";
import { PRODUCT_AFTER_PUSH, PRODUCT_CEREMONIE_MID, PRODUCT_TOP } from "./html.generated";
import { esc, eur } from "./render";

/*
 * Fiches hors Matcha Cérémonie : même composition et mêmes classes que la fiche
 * de la maquette (bloc d'achat, bandeau, étapes, onglets, FAQ, avis). Seuls les
 * textes changent ; rien n'y affirme un cultivar, une récolte ou une région
 * tant que le fournisseur ne les a pas confirmés.
 */

const I = "/stores/aoyuki/img/";
/* Même version d'URL que la maquette. */
const V = "?v=8";

interface Card {
  img: string;
  t: string;
  p: string;
  li: [string, string];
}
interface Sheet {
  saveur?: string;
  gallery: [string, string][];
  lead: string;
  puces: string[];
  ban: [string, string, string];
  steps?: { title: string; list: [string, string, string, string][] };
  tabs: [string, Card[]][];
  faq: { production: [string, string][] };
  conservation?: string;
  ingredients: string;
  origine: string;
}

const CONSERVER: Card = {
  img: "pp-formats.webp",
  t: "Bien le conserver",
  p: "Canette fermée, au frais, à l’abri de la lumière. Au réfrigérateur une fois ouverte.",
  li: ["Quatre à six semaines", "Une fois ouverte"],
};

const LATTE_STEPS = {
  title: "Trois gestes, un latte",
  list: [
    ["etape-1.webp", "etape-1-m.webp", "Étape 1", "Déposez 2 g de poudre, soit deux petites cuillères en bambou, dans un bol large."],
    ["pp-fouet-l.webp", "pp-geste.webp", "Étape 2", "Versez 50 ml d’eau à 75-80 °C, puis fouettez vite, en W, jusqu’à une mousse fine."],
    ["etape-latte.webp", "gal-latte.webp", "Étape 3", "Ajoutez 150 ml de lait chaud ou froid, avec des glaçons si vous aimez."],
  ] as [string, string, string, string][],
};

const latteProduction: [string, string][] = [
  ["D’où vient la base ?", "Du Japon. Le détail de la base est en cours de validation avec notre producteur."],
  ["Que contient-il ?", "Une base de matcha aromatisée. La composition complète est en cours de validation avec notre producteur."],
  ["Puis-je arrêter l’abonnement ?", "Oui, à tout moment depuis votre compte, sans frais ni durée minimale."],
];

function latte(saveur: string, img: string, extra: [string, string][], notes: [string, string], lead: string, c1: string, c2: string): Sheet {
  return {
    saveur,
    gallery: [
      [img, `Canette verte Aoyuki Matcha latte ${saveur}.`],
      ...extra,
      ["gal-latte.webp", "Matcha fouetté versé dans un verre de lait glacé."],
      ["pp-poudre.webp", "Poudre de matcha très fine."],
      ["pp-geste.webp", "Une main fouette un matcha dans un bol."],
    ],
    lead,
    puces: [notes[0], notes[1], "Aromatisé", "Base matcha du Japon", "Chaud ou glacé", "Prêt en deux minutes"],
    ban: ["Base matcha du Japon", `Note ${saveur.toLowerCase() === "yuzu" ? "de yuzu" : saveur.toLowerCase() === "vanille" ? "de vanille" : "de fraise"}`, "Chaud ou glacé"],
    steps: LATTE_STEPS,
    tabs: [
      ["Le goût", [
        { img, t: notes[0], p: c1, li: [notes[0], saveur] },
        { img: "pp-bol-4x5.webp", t: notes[1], p: c2, li: [notes[1], "Note légère"] },
        { img: "gal-latte.webp", t: "Chaud ou glacé", p: "Un lait bien froid et quelques glaçons, ou un lait chaud pour les matins d’hiver.", li: ["Lait chaud", "Lait froid"] },
        { img: "pp-geste.webp", t: "Mousse fine", p: "Vingt secondes de fouet ou de mousseur suffisent avant d’ajouter le lait.", li: ["Texture soyeuse", "Fouet ou mousseur"] },
      ]],
      ["Notre matcha", [
        { img: "pp-poudre.webp", t: "Base matcha du Japon", p: "Une poudre de thé vert japonais, fouettée comme un matcha classique.", li: ["Origine Japon", "Poudre fine"] },
        { img: "ic-tamis.webp", t: "Aromatisé", p: "Une note ajoutée à la base : c’est ce qui le distingue de notre Matcha Cérémonie.", li: ["Contient un arôme", `Note ${saveur.toLowerCase()}`] },
        { img: "pp-feuilles.webp", t: "Feuilles de thé", p: "Le matcha est une poudre de feuilles de thé vert ombrées et moulues.", li: ["Thé vert", "Feuilles ombrées"] },
        { img: "pp-ouverte.webp", t: "Canette de 30 g", p: "Une canette refermable qui garde la poudre à l’abri de la lumière.", li: ["30 g", "Refermable"] },
      ]],
      ["Composition", [
        { img: "pp-ouverte.webp", t: "Composition", p: "Base de matcha aromatisée. La liste complète est en cours de validation avec notre producteur.", li: ["Thé matcha", "Arôme"] },
        CONSERVER,
      ]],
    ],
    faq: { production: latteProduction },
    ingredients: "Composition en cours de validation avec notre producteur.",
    origine: `Base matcha du Japon, aromatisée. ${notes[0]}, ${notes[1].toLowerCase()}.`,
  };
}

const SHEETS: Record<string, Sheet> = {
  vanille: latte("Vanille", "prod-vanille.webp", [], ["Rond", "Doux"], "Une base de matcha du Japon aromatisée à la vanille. Ronde et douce, à fouetter puis à allonger de lait.", "Une note de vanille ronde, qui adoucit le végétal du matcha.", "Une tasse douce, à boire sans rien ajouter d’autre que du lait."),
  fraise: latte("Fraise", "prod-fraise.webp", [["vedette-fraise.webp", "Verre de latte glacé rose et vert à côté d’une canette Aoyuki Matcha latte Fraise."]], ["Fruité", "Frais"], "Une base de matcha du Japon aromatisée à la fraise. Le duo des cafés à matcha, à refaire chez vous.", "Une note de fraise sur la fraîcheur végétale du matcha.", "Un lait bien froid, quelques glaçons : le latte des beaux jours."),
  yuzu: latte("Yuzu", "prod-yuzu.webp", [], ["Vif", "Citronné"], "Une base de matcha du Japon aromatisée au yuzu. Vive et fraîche, à fouetter puis à servir sur glace.", "Une note de yuzu vive, qui réveille le matcha.", "Une finale citronnée, très agréable sur glace."),
  hojicha: {
    gallery: [
      ["prod-hojicha.webp", "Canette verte Aoyuki Hojicha, près d’une tasse de thé ambré."],
      ["tuile-hojicha.webp", "Tiges de thé torréfiées."],
    ],
    lead: "Un thé vert japonais doucement torréfié. Doux, grillé, aux notes de noisette.",
    puces: ["Doux", "Grillé", "Notes de noisette", "Thé torréfié", "Origine Japon", "Canette de 30 g"],
    ban: ["Thé torréfié du Japon", "Doux et grillé", "Notes de noisette"],
    tabs: [
      ["Le goût", [
        { img: "prod-hojicha.webp", t: "Grillé", p: "La torréfaction lui donne une tasse ambrée, ronde et grillée.", li: ["Tasse ambrée", "Note grillée"] },
        { img: "tuile-hojicha.webp", t: "Notes de noisette", p: "Un goût doux, proche de la noisette, sans l’amertume d’un thé vert.", li: ["Noisette", "Doux"] },
      ]],
      ["Notre hojicha", [
        { img: "tuile-hojicha.webp", t: "Thé vert torréfié", p: "Le hojicha est un thé vert japonais torréfié. Origine et grade à confirmer avec notre producteur.", li: ["Thé vert", "Torréfié"] },
        { img: "prod-hojicha.webp", t: "Canette de 30 g", p: "Une canette refermable qui garde le thé à l’abri de la lumière.", li: ["30 g", "Refermable"] },
      ]],
      ["Composition", [
        { img: "prod-hojicha.webp", t: "Composition", p: "Thé vert torréfié du Japon. Fiche détaillée en cours de validation avec notre producteur.", li: ["Thé vert", "Japon"] },
        { ...CONSERVER, img: "tuile-hojicha.webp" },
      ]],
    ],
    faq: {
      production: [
        ["Quelle différence avec le matcha ?", "Le matcha est une poudre de feuilles de thé vert ombrées et moulues, au goût vif et végétal. Le hojicha est un thé vert torréfié, au goût doux et grillé, proche de la noisette."],
        ["D’où vient ce hojicha ?", "Du Japon. Origine précise et grade sont à confirmer avec notre producteur."],
        ["Puis-je arrêter l’abonnement ?", "Oui, à tout moment depuis votre compte, sans frais ni durée minimale."],
      ],
    },
    ingredients: "Thé vert torréfié.",
    origine: "Japon. Doux, grillé, notes de noisette.",
  },
};

const STAR = '<svg aria-hidden="true"><use href="#i-star"/></svg>';
const ARR = PRODUCT_CEREMONIE_MID.match(/<div class="arr">[\s\S]*?<\/div>/)?.[0] ?? "";
const ROT = PRODUCT_TOP.match(/<div class="rot" data-rot>[\s\S]*?<\/div>\s*<\/div>/)?.[0] ?? "";

const span = (t: string) => `<span>${esc(t)}</span>`;

function top(item: CatalogItem, s: Sheet, catalog: Catalog): string {
  const p = item.product!;
  const thumbs = s.gallery
    .map(([src], i) => `<button type="button" data-gal-go="${i}" aria-label="Image ${i + 1} sur ${s.gallery.length}"${i === 0 ? ' aria-current="true"' : ""}><img src="${I}${src}${V}" alt="" loading="lazy"></button>`)
    .join("");
  const figures = s.gallery
    .map(([src, alt], i) => `<figure><img ${i === 0 ? 'data-gal-main fetchpriority="high"' : 'loading="lazy"'} src="${I}${src}${V}" alt="${esc(alt)}"></figure>`)
    .join("");
  const dots = s.gallery.map((_, i) => `<span${i === 0 ? ' class="is-on"' : ""}></span>`).join("");
  const sav = s.saveur
    ? `<div class="pp__field"><p class="pp__lab">Saveur <b>${esc(s.saveur)}</b></p><div class="sav">${["ceremonie", "vanille", "fraise", "yuzu"]
        .filter((h) => catalog.byHandle[h])
        .map((h) => {
          const it = catalog.byHandle[h];
          return h === item.handle
            ? `<span class="sav__i is-on" aria-current="true" title="${esc(it.name)}"><img src="${esc(it.img)}" alt="" width="62" height="76" loading="lazy"></span>`
            : `<a class="sav__i" href="/produit/${esc(it.slug)}" aria-label="${esc(it.name)}" title="${esc(it.name)}"><img src="${esc(it.img)}" alt="" width="62" height="76" loading="lazy"></a>`;
        })
        .join("")}</div></div>`
    : "";
  const formats = item.variants
    .map((v, i) => `<label><input type="radio" name="format" value="${esc(v.label)}" data-price="${v.price / 100}" data-grams="${parseInt(v.label, 10) || 0}"${i === 0 ? " checked" : ""}><span><b>${esc(v.label)}</b></span></label>`)
    .join("");
  const cross = catalog.items
    .filter((i) => i.handle !== item.handle)
    .slice(0, 3)
    .map(
      (i) =>
        `<li class="cr" data-product="${esc(i.handle)}"><img src="${esc(i.img)}" alt="" width="52" height="64" loading="lazy"><div><p class="cr__n">${esc(i.name)} ${esc(i.variants[0]?.label ?? "")}</p><p class="cr__p">${eur(i.price)}</p></div><button class="btn btn--line" type="button" data-add aria-label="Ajouter ${esc(i.name)} au panier">Ajouter</button></li>`,
    )
    .join("");
  const stars = STAR.repeat(5);
  const eng = eur(Math.round((item.price * 85) / 100));
  return `<div class="wrap pp">
    <div class="pp__gal">
      <div class="gal__thumbs" aria-label="Choisir une image">${thumbs}</div>
      <div class="gal__view"><div class="gal" data-gal tabindex="0" aria-label="Galerie de ${esc(item.name)}">${figures}</div><div class="gal__dots" aria-hidden="true">${dots}</div></div>
    </div>
    <form class="pp__buy" data-pp novalidate data-handle="${esc(item.handle)}">
      <nav class="fil" aria-label="Fil d'Ariane"><a href="/">Accueil</a><span aria-hidden="true">/</span><a href="/#produits">Nos thés</a><span aria-hidden="true">/</span><span aria-current="page">${esc(item.name)}</span></nav>
      <h1 class="pp__title">${esc(item.name)}<span class="dot">.</span></h1>
      <!--ex--><button class="pp__note-btn" type="button" data-open-drawer="tous-avis"><span class="st" role="img" aria-label="Exemple : cinq étoiles">${stars}</span><span>X,X/5</span> <u>(00 avis)</u> <em>exemple</em></button><!--/ex-->
      <p class="pp__lead">${esc(s.lead)}</p>
      <ul class="pp__puces">${s.puces.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
      ${sav}
      <fieldset class="pp__field"><legend class="pp__lab">Format</legend><div class="fmt"${item.variants.length === 1 ? ' style="grid-template-columns:1fr"' : ""}>${formats}</div></fieldset>
      <fieldset class="pp__field"><legend class="sr">Options d’achat</legend>
        <div class="opt">
          <label><input type="radio" name="mode" value="unique" data-off="0" checked><span class="opt__c"><span class="opt__dot" aria-hidden="true"></span><span class="opt__n">Achat unique</span><span class="opt__p"><b data-opt="unique">${eur(item.price)}</b></span></span></label>
          <label><input type="radio" name="mode" value="abo" data-off="10"><span class="opt__c"><span class="opt__dot" aria-hidden="true"></span><span class="opt__n">Abonnement</span><span class="opt__p"><s data-old="abo">${eur(item.price)}</s><b data-opt="abo">${eur(item.subPrice)}</b><small><em>-10 %</em> par canette</small></span></span></label>
          <!--ex--><label><input type="radio" name="mode" value="eng" data-off="15"><span class="opt__c"><span class="opt__tag">Exemple</span><span class="opt__dot" aria-hidden="true"></span><span class="opt__n">Abonnement 6 ou 12 mois</span><span class="opt__p"><s data-old="eng">${eur(item.price)}</s><b data-opt="eng">${eng}</b><small><em>-15 %</em> par canette</small></span></span></label><!--/ex-->
        </div>
        <div class="freq" data-pp-freq hidden><p class="freq__label" id="freq-label">Livraison tous les</p><div class="freq__row" role="radiogroup" aria-labelledby="freq-label"><label><input type="radio" name="freq" value="30" checked><span>30 jours</span></label><label><input type="radio" name="freq" value="45"><span>45 jours</span></label><label><input type="radio" name="freq" value="60"><span>60 jours</span></label></div></div>
      </fieldset>
      <div class="pp__cta" data-pp-cta>
        <div class="qty" role="group" aria-label="Quantité"><button type="button" data-qty="-1" aria-label="Retirer une canette">-</button><output data-pp-qty aria-live="polite">1</output><button type="button" data-qty="1" aria-label="Ajouter une canette">+</button></div>
        <button class="btn btn--sapin pp__add" type="submit"><span data-pp-add>Ajouter au panier · ${eur(item.price)}</span></button>
      </div>
      ${ROT}
      <details class="acc"><summary>Description</summary><div class="acc__b"><p>${esc(p.description)}</p><h3>Ingrédients</h3><p class="acc__big">${esc(s.ingredients)}</p><h3>Origine et goût</h3><p>${esc(s.origine)}</p><h3>Conservation</h3><p>Canette bien fermée, au frais, à l’abri de la lumière. Une fois ouverte, gardez-la au réfrigérateur et finissez-la en quatre à six semaines.</p><h3>Livraison et retours<!--ex--> <em>maquette</em><!--/ex--></h3><p>Livraison en France, offerte dès 45 €. Retours sous 14 jours pour une canette non ouverte.<!--ex--> Conditions d’exemple, à confirmer au lancement.<!--/ex--></p></div></details>
      ${cross ? `<details class="acc" open><summary>Produits complémentaires</summary><ul class="acc__b crs">${cross}</ul></details>` : ""}
    </form>
  </div>`;
}

function ban(s: Sheet): string {
  const items = s.ban.map(span).join("<i></i>");
  const dup = s.ban.map((t) => `<i class="ban__dup"></i><span class="ban__dup" aria-hidden="true">${esc(t)}</span>`).join("");
  return `<section class="ban" aria-label="L'essentiel"><div class="ban__t">${items}${dup}<i class="ban__dup"></i></div></section>`;
}

function steps(s: Sheet): string {
  if (!s.steps) return "";
  const { title, list } = s.steps;
  const arts = list
    .map(([d, m, h, p]) => `<article class="sp"><picture><source media="(min-width: 860px)" srcset="${I}${d}${V}"><img src="${I}${m}${V}" alt="" loading="lazy"></picture><div class="sp__in"><h3>${esc(h)}</h3><p>${esc(p)}</p></div></article>`)
    .join("");
  const thumbs = list
    .map(([, m], i) => `<button type="button" data-step="${i}"${i === 0 ? ' aria-current="true"' : ""} aria-label="Étape ${i + 1}"><img src="${I}${m}${V}" alt="" loading="lazy"><span>${i + 1}</span></button>`)
    .join("");
  return `<section class="steps" id="preparation" aria-labelledby="steps-t" data-steps><div class="steps__track" data-steps-track tabindex="0" aria-label="Trois étapes de préparation">${arts}</div><h2 id="steps-t" class="steps__t">${esc(title)}</h2><div class="steps__thumbs">${thumbs}</div></section>`;
}

function info(s: Sheet): string {
  const tabs = s.tabs
    .map(([label], i) => `<button role="tab" id="o${i + 1}" aria-controls="p${i + 1}" aria-selected="${i === 0}"${i ? ' tabindex="-1"' : ""} type="button">${esc(label)}</button>`)
    .join("");
  const panels = s.tabs
    .map(([, cards], i) => {
      const arts = cards
        .map((c) => `<article class="ic"><img src="${I}${c.img}${V}" alt="" loading="lazy"><div class="ic__in"><h3>${esc(c.t)}</h3><p>${esc(c.p)}</p><ul>${c.li.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div></article>`)
        .join("");
      return `<div class="info__track" id="p${i + 1}" role="tabpanel" aria-labelledby="o${i + 1}" data-info-track tabindex="0"${i ? " hidden" : ""}>${arts}</div>`;
    })
    .join("");
  return `<section class="info" aria-label="En savoir plus"><div class="wrap"><div class="info__head"><div class="info__tabs" role="tablist" aria-label="En savoir plus">${tabs}</div>${ARR}</div>${panels}</div></section>`;
}

const details = (l: [string, string][]) => l.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("");

function faq(s: Sheet, item: CatalogItem): string {
  const hojicha = item.handle === "hojicha";
  const conso: [string, string][] = hojicha
    ? [
        ["Quand le boire ?", "Quand vous voulez : doux et grillé, il se prête aussi à une pause l’après-midi, en gardant en tête qu’il contient de la caféine."],
        ["Contient-il de la caféine ?", "Oui, comme tout thé. Le hojicha n’est pas un thé sans théine. Si vous y êtes sensible, préférez-le le matin."],
      ]
    : [
        ["Quelle quantité par préparation ?", "Environ 2 g, soit deux petites cuillères en bambou."],
        ["Comment le préparer en latte ?", "Fouettez 2 g de poudre dans 50 ml d’eau à 75-80 °C, puis ajoutez 150 ml de lait chaud ou froid, avec des glaçons si vous aimez."],
        ["Faut-il un fouet en bambou ?", "C’est l’idéal pour une mousse fine. Un petit mousseur à lait électrique fait très bien l’affaire."],
        ["Contient-il de la caféine ?", "Oui, comme tout thé. Si vous y êtes sensible, préférez-le le matin."],
      ];
  return `<section class="fq" aria-labelledby="fq-t"><div class="wrap fq__g"><div class="fq__side"><h2 id="fq-t" class="h2">FAQ<span class="dot">.</span></h2><div class="fq__cats" role="tablist" aria-label="Catégories"><button role="tab" id="c1" aria-controls="f1" aria-selected="true" type="button">Consommation</button><button role="tab" id="c2" aria-controls="f2" aria-selected="false" tabindex="-1" type="button">Production</button></div></div><div><div class="fq__l" id="f1" role="tabpanel" aria-labelledby="c1">${details(conso)}</div><div class="fq__l" id="f2" role="tabpanel" aria-labelledby="c2" hidden>${details(s.faq.production)}</div></div></div></section>`;
}

/** Retire les avis d'exemple propres au matcha nature (cadre de la fiche : Cérémonie seule). */
function afterPush(s: Sheet, item: CatalogItem): string {
  return PRODUCT_AFTER_PUSH.replace(/<section class="fq"[\s\S]*?<\/section>/, faq(s, item)).replace(
    /<figure class="rv__s"><blockquote>(?:Un vert profond|Très doux)[\s\S]*?<\/figure>/g,
    "",
  );
}

export function sheetFor(handle: string): Sheet | undefined {
  return SHEETS[handle];
}

export interface FicheParts {
  top: string;
  middle: string;
  after: string;
}

export function ficheParts(item: CatalogItem, catalog: Catalog): FicheParts | null {
  const s = SHEETS[item.handle];
  if (!s) return null;
  return { top: top(item, s, catalog), middle: `${ban(s)}${steps(s)}${info(s)}`, after: afterPush(s, item) };
}

const PUSH_META: Record<string, { cat: string; img: string; tags: [string, string] }> = {
  ceremonie: { cat: "Matcha nature", img: "prod-ceremonie.webp", tags: ["Doux", "Umami"] },
  vanille: { cat: "Matcha aromatisé", img: "prod-vanille.webp", tags: ["Rond", "Doux"] },
  fraise: { cat: "Matcha aromatisé", img: "prod-fraise.webp", tags: ["Fruité", "Frais"] },
  yuzu: { cat: "Matcha aromatisé", img: "prod-yuzu.webp", tags: ["Vif", "Citronné"] },
  hojicha: { cat: "Thé torréfié", img: "prod-hojicha.webp", tags: ["Grillé", "Noisette"] },
};

/** Bloc « autres thés » : mêmes cartes que la fiche Cérémonie, sans le produit affiché. */
export function pushFor(pushHtml: string, item: CatalogItem, catalog: Catalog): string {
  const cards = catalog.items
    .filter((i) => i.handle !== item.handle && PUSH_META[i.handle])
    .map((i) => {
      const m = PUSH_META[i.handle];
      return `<article class="pr pc" data-product="${esc(i.handle)}"><a class="pr__media" href="/produit/${esc(i.slug)}" aria-label="Voir ${esc(i.name)}"><img src="${I}${m.img}${V}" alt="" loading="lazy"></a><p class="pc__cat">${esc(m.cat)}</p><div class="pr__row"><h3 class="pr__name"><a href="/produit/${esc(i.slug)}">${esc(i.name.replace("Matcha latte", "Latte").replace("Matcha Cérémonie", "Cérémonie"))}</a></h3><p class="pr__price">${eur(i.price)}<span>${esc(i.variants[0]?.label ?? "")}</span></p></div><ul class="pc__tags"><li>${esc(m.tags[0])}</li><li>${esc(m.tags[1])}</li></ul><button class="btn btn--line pr__add" type="button" data-add aria-label="Ajouter ${esc(i.name)} au panier">Ajouter</button></article>`;
    })
    .join("");
  return pushHtml.replace(/<div class="pr-list">[\s\S]*<\/article>(?:<!--\/if-->)?<\/div>/, `<div class="pr-list">${cards}</div>`);
}
