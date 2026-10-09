/*
 * Utilitaires de l'admin des contenus (catégories, pages) — sans dépendance
 * serveur, utilisables par les formulaires.
 */

/** Segments déjà pris par des routes du site : interdits comme URL de contenu. */
export const RESERVED_SEGMENTS = new Set([
  "admin", "api", "en", "he", "boutique", "journal", "collections", "collection",
  "la-maison", "rendez-vous", "guide-des-tailles", "services", "livraison-retours",
  "entretien", "mentions-legales", "cgv", "confidentialite", "retractation",
  "compte", "commande", "panier", "produit", "recherche", "sitemap.xml",
  "robots.txt", "icon", "opengraph-image", "favicon.ico", "_next",
]);

export function normalizeSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export type Faq = { q: string; a: string };

/**
 * FAQ ⇄ texte éditable :
 *   Q: question
 *   R: réponse (plusieurs lignes possibles)
 *   (ligne vide entre deux questions)
 */
export function faqsToText(faqs: Faq[] | null | undefined): string {
  return (faqs ?? []).map((f) => `Q: ${f.q}\nR: ${f.a}`).join("\n\n");
}

export function textToFaqs(text: string): Faq[] {
  const out: Faq[] = [];
  let cur: Faq | null = null;
  let field: "q" | "a" | null = null;
  for (const raw of text.replace(/\r/g, "").split("\n")) {
    const line = raw.trimEnd();
    const q = line.match(/^Q\s*:\s*(.*)$/i);
    const a = line.match(/^R\s*:\s*(.*)$/i);
    if (q) {
      if (cur?.q) out.push(cur);
      cur = { q: q[1].trim(), a: "" };
      field = "q";
    } else if (a && cur) {
      cur.a = a[1].trim();
      field = "a";
    } else if (line.trim() && cur && field) {
      cur[field] = `${cur[field]} ${line.trim()}`.trim();
    }
  }
  if (cur?.q) out.push(cur);
  return out.filter((f) => f.q && f.a);
}
