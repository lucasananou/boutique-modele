import type { Metadata } from "next";
import type { ComponentType, ReactNode } from "react";

/*
 * Vitrine sur mesure d'une boutique (src/stores/<id>/front/index.tsx).
 *
 * Quand une boutique a un design propre qui ne se plie pas aux pages du modèle
 * (page de marque d'un produit unique, advertorial…), elle fournit ses pages
 * ici. Le modèle garde tout le reste : base, checkout Stripe, webhooks,
 * abonnements, comptes, e-mails, admin.
 *
 * Mécanique : src/proxy.ts réécrit les URL publiques vers /vitrine/<chemin>
 * (l'URL affichée ne change pas) ; src/app/vitrine/[[...path]] demande la page
 * à `resolve`. Le layout racine ne charge alors ni Tailwind ni les composants
 * du modèle : la vitrine apporte ses propres styles (aucune collision de
 * classes, aucun reset imposé).
 *
 * Fichier généré au build : src/stores/current-front.ts (scripts/select-store.mjs).
 */

export type SearchParams = Record<string, string | string[] | undefined>;

export interface FrontRoute {
  metadata?: Metadata;
  render: (props: { searchParams: SearchParams }) => ReactNode | Promise<ReactNode>;
}

export interface StoreFront {
  /** Classes du <html> (variables CSS des polices next/font). */
  htmlClassName: string;
  /** Langue du document. */
  lang: string;
  /** Enveloppe commune de toutes les pages (styles globaux, dialogues…). */
  Layout: ComponentType<{ children: ReactNode }>;
  /** Page du chemin demandé (segments sans le préfixe /vitrine), ou null → 404. */
  resolve: (segments: string[]) => FrontRoute | null;
  /** Page 404 de la vitrine. */
  NotFound: ComponentType;
  /** Métadonnées communes (titre par défaut, robots…). */
  metadata: Metadata;
}
