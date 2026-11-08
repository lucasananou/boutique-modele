import type { ReactNode } from "react";
import { ASSET_VERSION, CART_DRAWER, HEADER, HOME_ANNOUNCE, HOME_FOOT, SPRITE, TOAST } from "./html.generated";
import { type Catalog, clientCatalog } from "./catalog";
import { fill } from "./render";
import Interactions from "./Interactions";

/* Enveloppe commune : styles et polices de la maquette, chrome, tiroir panier, toast. */

const A = "/stores/aoyuki";
const css = (name: string) => `${A}/${name}.css?v=${ASSET_VERSION}`;
const Html = ({ html }: { html: string }) => <div style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: html }} />;

export function Head({ produit = false }: { produit?: boolean }) {
  return (
    <>
      <link rel="preload" href={`${A}/fonts/fraunces-600-italic.woff2`} as="font" type="font/woff2" crossOrigin="anonymous" />
      <link rel="preload" href={`${A}/fonts/dmsans.woff2`} as="font" type="font/woff2" crossOrigin="anonymous" />
      <link rel="stylesheet" href={css("style")} precedence="aoyuki" />
      {produit && <link rel="stylesheet" href={css("produit")} precedence="aoyuki" />}
      <link rel="stylesheet" href={css("boutique")} precedence="aoyuki" />
    </>
  );
}

export interface PageProps {
  catalog: Catalog;
  announce?: string;
  foot?: string;
  /** Tiroirs et barre spécifiques à la page, après le toast. */
  extra?: string;
  produit?: boolean;
  /** Contenu du <main> (HTML de la maquette) ou composants React. */
  html?: string;
  children?: ReactNode;
}

export default function Page({ catalog, announce = HOME_ANNOUNCE, foot = HOME_FOOT, extra = "", produit = false, html, children }: PageProps) {
  const data = JSON.stringify(clientCatalog(catalog)).replace(/</g, "\\u003c");
  return (
    <div className={produit ? "page-produit" : undefined} style={{ display: "contents" }}>
      <Head produit={produit} />
      <script id="aoyuki-catalog" type="application/json" dangerouslySetInnerHTML={{ __html: data }} />
      <Html html={fill(`<a class="skip" href="#contenu">Aller au contenu</a>${SPRITE}${announce}${HEADER}`, catalog)} />
      {html !== undefined ? (
        <main id="contenu" dangerouslySetInnerHTML={{ __html: fill(html, catalog) }} />
      ) : (
        <main id="contenu">{children}</main>
      )}
      <Html html={fill(`${foot}${CART_DRAWER}${TOAST}${extra}`, catalog)} />
      <Interactions />
    </div>
  );
}
