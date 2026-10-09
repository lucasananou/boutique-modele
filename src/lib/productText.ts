/*
 * Mise en forme des textes produit importés d'un ancien site (souvent des pavés
 * avec emojis collés et des « \n » littéraux). On structure au RENDU pour que
 * ce soit scannable, sans toucher aux données.
 */

export interface Feature {
  icon: string;
  label: string;
  text: string;
}

/**
 * Découpe une description courte « à puces emoji » en items lisibles.
 * Ex. "✨ Conformité : ...🌊 Design : ...🍃 Matière : ..." → 3 features.
 * Renvoie null si moins de 2 segments emoji (→ afficher en simple paragraphe).
 */
export function parseFeatures(text: string): Feature[] | null {
  if (!text) return null;
  const re = /(\p{Extended_Pictographic})\s*([^\p{Extended_Pictographic}]+)/gu;
  const items: Feature[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const seg = m[2].trim().replace(/\s+/g, " ");
    if (!seg) continue;
    const sep = seg.search(/\s:\s/);
    if (sep > -1) {
      items.push({
        icon: m[1],
        label: seg.slice(0, sep).trim(),
        text: seg.slice(sep + 3).trim(),
      });
    } else {
      items.push({ icon: m[1], label: "", text: seg });
    }
  }
  return items.length >= 2 ? items : null;
}

/**
 * Nettoie une description longue et la découpe en paragraphes propres
 * (gère les « \n » littéraux et les vrais retours à la ligne).
 */
export function toParagraphs(text: string): string[] {
  if (!text) return [];
  return text
    .replace(/\\n/g, "\n") // « \n » littéral → vrai saut de ligne
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
