/** Données du guide des tailles — partagées par la page /guide-des-tailles et la modale fiche produit. */

/** [Taille, FR, Poitrine (cm), Taille (cm), Hanches (cm)] — indicatif. */
export const sizeRows: string[][] = [
  ["S", "36 – 38", "84 – 88", "66 – 70", "92 – 96"],
  ["M", "38 – 40", "88 – 92", "70 – 74", "96 – 100"],
  ["L", "40 – 42", "92 – 98", "74 – 80", "100 – 106"],
  ["XL", "44 – 46", "98 – 104", "80 – 86", "106 – 112"],
  ["XXL", "46 – 48", "104 – 110", "86 – 92", "112 – 118"],
  ["XXXL", "48 – 50", "110 – 116", "92 – 98", "118 – 124"],
];

export const sizeColumns = ["Taille", "FR", "Poitrine (cm)", "Taille (cm)", "Hanches (cm)"];

/** Notes affichées sous le tableau (à adapter au catalogue de la boutique). */
export const lengthNotes: [string, string][] = [
  [
    "Longueurs",
    "La longueur exacte de chaque pièce est indiquée sur sa fiche produit.",
  ],
  [
    "Entre deux tailles",
    "Choisissez la taille au-dessus pour un tombé plus ample, ou écrivez-nous pour un conseil personnalisé.",
  ],
];
