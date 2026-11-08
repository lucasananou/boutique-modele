import type { ReactNode } from "react";
import { store } from "@/stores";
import { loadCatalog } from "../catalog";
import { DRAWER_RETOURS } from "../html.generated";
import Page from "../Page";
import { fill } from "../render";

/*
 * Pages légales provisoires : le vendeur, le médiateur et les conditions de
 * vente sont à compléter avant toute mise en vente (voir
 * projets/matcha/marque/MISE-EN-PRODUCTION.md). Rien n'est inventé.
 */

const seller = store.seller;
const mediator = store.mediator;
const hosting = store.hosting;
const TODO = (label: string) => <em className="legal-todo">[À compléter avant le lancement : {label}]</em>;

async function LegalPage({ eyebrow, title, children, produit = false }: { eyebrow: string; title: string; children: ReactNode; produit?: boolean }) {
  const catalog = await loadCatalog();
  return (
    <Page catalog={catalog} produit={produit}>
      <article className="shop-page legal-page">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="h2">{title}<span className="dot">.</span></h1>
        {!seller && <p className="demo-note">Document provisoire : l’identité du vendeur et plusieurs conditions restent à compléter avant toute vente réelle.</p>}
        {children}
      </article>
    </Page>
  );
}

export function Mentions() {
  return (
    <LegalPage eyebrow="Informations légales" title="Mentions légales">
      <h2>Vendeur et éditeur du site</h2>
      {seller ? <p>{seller.name}, {seller.form}, {seller.registration}, {seller.address}. Contact : {seller.email}.</p> : <p>{TODO("dénomination sociale, forme, siège, n° d’immatriculation, directeur de la publication, e-mail, téléphone")}</p>}
      <h2>Hébergement</h2>
      <p>{hosting.name}, {hosting.address}.</p>
      <h2>Médiation de la consommation</h2>
      {mediator ? <p>{mediator.name}, {mediator.address}. <a href={mediator.url}>{mediator.url}</a></p> : <p>{TODO("nom et coordonnées du médiateur de la consommation")}</p>}
      <h2>Propriété intellectuelle</h2>
      <p>La marque, les textes et les visuels du site sont réservés. Toute reproduction sans accord écrit est interdite.</p>
      <h2>Illustrations</h2>
      <p>Les images de la boutique sont des illustrations générées pour la préproduction, avant remplacement par des photos du produit réel.</p>
    </LegalPage>
  );
}

export function Cgv() {
  return (
    <LegalPage eyebrow="Informations légales" title="Conditions générales de vente">
      <h2>Vendeur</h2>
      <p>{seller ? `${seller.name}, ${seller.address}.` : TODO("identité complète du vendeur")}</p>
      <h2>Produits et prix</h2>
      <p>Les prix sont indiqués en euros, toutes taxes comprises, hors frais de livraison éventuels annoncés avant paiement.</p>
      <h2>Commande et paiement</h2>
      <p>La commande est confirmée après acceptation du paiement et envoi d’un e-mail de confirmation.</p>
      <h2>Livraison</h2>
      <p>Livraison en France métropolitaine. Délais à confirmer au lancement : {TODO("délais réels de préparation et de transport, tarif sous le seuil de gratuité")}.</p>
      <h2>Abonnement</h2>
      <p>Livraison tous les 30, 45 ou 60 jours, remise de {store.subscriptions?.discountPercent ?? 10} %, sans engagement : suspension, report ou résiliation en un clic depuis le compte ou le lien de l’e-mail.</p>
      <h2>Droit de rétractation</h2>
      <p>Vous disposez de 14 jours à compter de la réception pour vous rétracter, sans motif, via le formulaire de la <a href="/retractation">page dédiée</a>. Une canette non ouverte peut être retournée.</p>
      <h2>Garanties et médiation</h2>
      <p>Garanties légales de conformité et des vices cachés. Médiateur : {mediator ? mediator.name : TODO("médiateur de la consommation")}.</p>
    </LegalPage>
  );
}

export function Confidentialite() {
  return (
    <LegalPage eyebrow="Informations légales" title="Confidentialité">
      <p>Nous collectons les données nécessaires à la commande, à la livraison et au service client (nom, adresse, e-mail, téléphone facultatif) et, avec votre accord, votre e-mail pour la newsletter. Elles ne sont jamais revendues.</p>
      <h2>Responsable du traitement</h2>
      <p>{seller ? seller.name : TODO("identité du responsable de traitement et contact données personnelles")}</p>
      <h2>Vos droits</h2>
      <p>Accès, rectification, suppression, opposition : écrivez-nous à l’adresse indiquée dans les mentions légales.</p>
      <h2>Prestataires</h2>
      <p>Hébergement : {hosting.name}. Paiement : Stripe. Envoi d’e-mails : Resend.</p>
      <h2>Cookies</h2>
      <p>Uniquement les cookies nécessaires au panier et au compte. Aucun cookie publicitaire.</p>
    </LegalPage>
  );
}

export async function Retractation() {
  const catalog = await loadCatalog();
  const form = fill(
    DRAWER_RETOURS.replace(" hidden>", ">")
      .replace('<div class="drawer"', '<div class="drawer drawer--page"')
      .replace(/<!--ex--><p>Formulaire de démonstration[\s\S]*?<!--\/ex-->/, ""),
    catalog,
  );
  return (
    <LegalPage eyebrow="Service client" title="Rétractation et retours" produit>
      <p>Vous disposez de 14 jours après réception pour vous rétracter. Une canette non ouverte peut être retournée. Remplissez le formulaire ci-dessous : votre demande nous est transmise.</p>
      <div dangerouslySetInnerHTML={{ __html: form }} />
    </LegalPage>
  );
}
