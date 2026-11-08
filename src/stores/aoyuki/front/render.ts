import { store } from "@/stores";
import type { Catalog, CatalogItem } from "./catalog";
import { showExamples } from "./catalog";

/*
 * Gabarits de la maquette (html.generated.ts) → HTML final : retire ou garde
 * les contenus d'exemple (SHOW_EXAMPLE_CONTENT, interrupteur unique), retire
 * les blocs des produits absents du catalogue, puis remplace les jetons de
 * prix et de nom par les valeurs en base.
 */

export const eur = (cents: number) =>
  (cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

export const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const off = (cents: number, pct: number) => Math.round((cents * (100 - pct)) / 100);

export function fill(html: string, catalog: Catalog): string {
  const examples = showExamples();
  const sub = store.subscriptions?.discountPercent ?? 10;
  const item = (h: string): CatalogItem | undefined => catalog.byHandle[h];
  const ceremonie = item("ceremonie");
  return html
    .replace(/<!--ex-->([\s\S]*?)(?:<!--else-->([\s\S]*?))?<!--\/ex-->/g, (_m, on, offText = "") => (examples ? on : offText))
    .replace(/<!--if:([\w-]+)-->([\s\S]*?)<!--\/if-->/g, (_m, h, body) => (item(h) ? body : ""))
    .replace(/\{\{(\w+):([\w-]+)\}\}/g, (m, kind, key) => {
      if (kind === "vn") {
        const v = ceremonie?.variants.find((x) => x.label.startsWith(`${key} `) || x.label === `${key} g`);
        return String((v?.price ?? 0) / 100);
      }
      const it = item(key);
      if (!it) return "";
      switch (kind) {
        case "n":
          return String(it.price / 100);
        case "eur":
          return eur(it.price);
        case "abo":
          return eur(off(it.price, sub));
        case "eng":
          return eur(off(it.price, 15));
        case "name":
          return esc(it.name);
        case "href":
          return `/produit/${it.slug}`;
        default:
          return m;
      }
    });
}
