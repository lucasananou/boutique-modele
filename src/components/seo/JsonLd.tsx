/**
 * Injecte un bloc de données structurées JSON-LD.
 * Le contenu est contrôlé par l'application (jamais de saisie utilisateur) →
 * dangerouslySetInnerHTML est sûr ici.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
