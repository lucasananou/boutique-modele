import { createElement, Fragment, type ReactNode } from "react";

/*
 * Corps HTML d'une page de contenu (base de données, éditable dans l'admin)
 * → éléments React, SANS élément enveloppe : le DOM produit est celui du HTML
 * source (les règles CSS du type `.article-prose > p:first-child` continuent
 * de s'appliquer).
 *
 * Volontairement minimal et sûr :
 *  - liste blanche de balises et d'attributs (pas de script, style, iframe,
 *    gestionnaires `on*`, ni de lien `javascript:`) ; une balise inconnue est
 *    ignorée mais son texte est conservé ;
 *  - tolérant : balise fermante orpheline ignorée, balises non fermées closes
 *    en fin de document.
 *  - `<cited-product data-props='{"category":"robes"}'></cited-product>` est
 *    remplacé par le rendu fourni (`renderCited`) : bloc « produit cité ».
 */

const ALLOWED_TAGS = new Set([
  "p", "h2", "h3", "h4", "ul", "ol", "li", "a", "strong", "em", "b", "i", "u",
  "br", "hr", "blockquote", "table", "thead", "tbody", "tr", "th", "td",
  "span", "small", "sup", "sub", "figure", "figcaption", "img",
]);
const VOID_TAGS = new Set(["br", "hr", "img"]);
const ALLOWED_ATTRS: Record<string, string[]> = {
  a: ["href", "title", "target", "rel"],
  img: ["src", "alt", "width", "height", "loading"],
  th: ["colspan", "rowspan", "scope"],
  td: ["colspan", "rowspan"],
  "*": ["id", "class"],
};
const ATTR_NAME: Record<string, string> = {
  class: "className",
  colspan: "colSpan",
  rowspan: "rowSpan",
};

const ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
};

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const code = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

function safeUrl(url: string): string | null {
  const u = url.trim();
  if (/^(javascript|data|vbscript):/i.test(u.replace(/\s/g, ""))) return null;
  return u;
}

interface Node {
  tag: string;
  attrs: Record<string, string>;
  children: (Node | string)[];
}

function parse(html: string): Node {
  const root: Node = { tag: "#root", attrs: {}, children: [] };
  const stack: Node[] = [root];
  const re = /<!--[\s\S]*?-->|<\/?([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^\s=>/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>/g;
  let last = 0;
  let m: RegExpExecArray | null;
  const top = () => stack[stack.length - 1];
  while ((m = re.exec(html))) {
    if (m.index > last) top().children.push(decodeEntities(html.slice(last, m.index)));
    last = re.lastIndex;
    if (m[0].startsWith("<!--")) continue;
    const tag = m[1].toLowerCase();
    if (m[0][1] === "/") {
      const idx = stack.map((n) => n.tag).lastIndexOf(tag);
      if (idx > 0) stack.length = idx; // ferme jusqu'à la balise correspondante
      continue;
    }
    const attrs: Record<string, string> = {};
    const attrRe = /([^\s=>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
    let a: RegExpExecArray | null;
    while ((a = attrRe.exec(m[2] ?? ""))) {
      attrs[a[1].toLowerCase()] = decodeEntities(a[2] ?? a[3] ?? a[4] ?? "");
    }
    const node: Node = { tag, attrs, children: [] };
    top().children.push(node);
    if (!VOID_TAGS.has(tag) && !m[3]) stack.push(node);
  }
  if (last < html.length) top().children.push(decodeEntities(html.slice(last)));
  return root;
}

function toReact(
  node: Node | string,
  key: string,
  renderCited: (props: Record<string, string>, key: string) => ReactNode,
): ReactNode {
  if (typeof node === "string") return node;
  if (node.tag === "cited-product") {
    let props: Record<string, string> = {};
    try {
      props = JSON.parse(node.attrs["data-props"] ?? "{}");
    } catch {
      props = {};
    }
    return renderCited(props, key);
  }
  const children = node.children.map((c, i) => toReact(c, `${key}.${i}`, renderCited));
  if (!ALLOWED_TAGS.has(node.tag)) {
    // Balise inconnue ou interdite : contenu texte conservé, balise retirée
    // (script/style : rien du tout).
    return node.tag === "script" || node.tag === "style"
      ? null
      : createElement(Fragment, { key }, ...children);
  }
  const props: Record<string, string> = { key };
  const allowed = [...(ALLOWED_ATTRS[node.tag] ?? []), ...ALLOWED_ATTRS["*"]];
  for (const [name, value] of Object.entries(node.attrs)) {
    if (!allowed.includes(name)) continue;
    if (name === "href" || name === "src") {
      const url = safeUrl(value);
      if (url === null) continue;
      props[name] = url;
    } else {
      props[ATTR_NAME[name] ?? name] = value;
    }
  }
  return VOID_TAGS.has(node.tag)
    ? createElement(node.tag, props)
    : createElement(node.tag, props, ...children);
}

/** Convertit le HTML en nœuds React (tableau, à placer dans un conteneur). */
export function htmlToReact(
  html: string,
  renderCited: (props: Record<string, string>, key: string) => ReactNode = () => null,
): ReactNode[] {
  return parse(html).children.map((c, i) => toReact(c, String(i), renderCited));
}
