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
import { loadCatalog, loadProduct, showExamples } from "../catalog";
import { ficheParts, pushFor } from "../fiches";
import { esc, eur } from "../render";


export default async function ProductPage({ slug }: { slug: string }) {
  const [catalog, item] = await Promise.all([loadCatalog(), loadProduct(slug)]);
  if (!item || !item.variants.length) notFound();
  const examples = showExamples();
  const ceremonie = item.handle === "ceremonie";
  const parts = ceremonie ? null : ficheParts(item, catalog);
  if (!ceremonie && !parts) notFound();
  const top = parts ? parts.top : PRODUCT_TOP;
  const middle = parts ? parts.middle : PRODUCT_CEREMONIE_MID;
  const after = parts ? parts.after : PRODUCT_AFTER_PUSH;
  const push = parts ? pushFor(PRODUCT_PUSH, item, catalog) : PRODUCT_PUSH;
  const html = `${top}${middle}${push}${after}${PRODUCT_NEWS}`;
  const buybar = ceremonie
    ? BUYBAR
    : BUYBAR.replace("Matcha Cérémonie", esc(item.name)).replace("{{eur:ceremonie}}", eur(item.price)).replace("30 g", esc(item.variants[0].label));
  const extra = `${examples ? DRAWER_TOUS_AVIS : ""}${DRAWER_RETOURS}${buybar}`;
  return <Page catalog={catalog} produit announce={PRODUCT_ANNOUNCE} foot={ceremonie ? PRODUCT_FOOT : PRODUCT_FOOT.replace("<span>Matcha Cérémonie</span>", `<span>${esc(item.name)}</span>`)} extra={extra} html={html} />;
}
