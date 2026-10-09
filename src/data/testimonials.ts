/**
 * Photos des clientes affichées sur l'accueil.
 *
 * Le TEXTE des avis vit dans `src/stores/<id>/translations.ts`
 * (homePage.testimonials) ; ce fichier ne porte que ce qui ne change pas d'une langue à
 * l'autre : la photo et, si on veut, la pièce portée.
 *
 * ── Ajouter ou remplacer une photo ─────────────────────────────────────────
 * 1. Déposer le fichier dans `public/customer-reviews/`.
 * 2. ⚠️ Le convertir en WebP et le limiter à ~1000 px de large. Ce site
 *    utilise un chargeur d'images personnalisé : Next NE redimensionne PAS les
 *    fichiers locaux, il sert l'original tel quel. Un PNG de 2 Mo partirait
 *    entier chez chaque visiteuse (les 10 photos d'origine pesaient 20 Mo,
 *    contre 0,8 Mo une fois converties).
 * 3. Renseigner `productSlug` pour rendre la photo cliquable vers la fiche :
 *    c'est ce qui transforme une preuve sociale en vente.
 *
 * Une `image` vide affiche un emplacement dessiné plutôt qu'une image cassée.
 */
export interface TestimonialMedia {
  /** Chemin public de la photo. Vide = emplacement dessiné. */
  image: string;
  /** Slug de la pièce portée — rend la photo cliquable vers la fiche. */
  productSlug?: string;
}

/**
 * Toutes les photos du carrousel, dans l'ordre d'affichage.
 *
 * Les avis rédigés (traduits dans translations.ts) sont rattachés aux
 * PREMIÈRES photos de la liste, dans l'ordre : la 1re photo porte le 1er avis,
 * la 2e le deuxième, etc. Les suivantes s'affichent en photo seule.
 * Pour mettre un avis en tête du carrousel, il suffit donc de déplacer sa photo.
 */
export const customerPhotos: TestimonialMedia[] = [
  // Vide dans le modèle : le carrousel d'avis est masqué tant qu'aucune photo
  // n'est renseignée. N'y mettre que de VRAIS avis clientes (avec accord).
];
