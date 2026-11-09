import type { ReactNode } from "react";
import { store } from "@/stores";
import Page from "../Page";
import RetourForm from "../RetourForm";

/*
 * Pages légales : vendeur renseigné (MAISON ANANOU - F.Z.E). Restent à
 * compléter avant toute mise en vente : contact, médiateur, livraison (voir
 * projets/mon-joli-bola/BASCULE.md). Rien n'est inventé.
 */

const seller = store.seller;
const mediator = store.mediator;
const hosting = store.hosting;
const TODO = (label: string) => <em className="legal-todo">[À compléter avant le lancement : {label}]</em>;

async function LegalPage({ eyebrow, title, children, produit = false }: { eyebrow: string; title: string; children: ReactNode; produit?: boolean }) {
  return (
    <Page>
      <article className="shop-page legal-page">
        <p className="sur">{eyebrow}</p>
        <h1 className="h2">{title}</h1>
        {(!seller || !seller.email || !mediator) && <p className="demo-note">Document provisoire : plusieurs informations restent à compléter avant toute vente réelle. Les commandes sont fermées.</p>}
        {children}
      </article>
    </Page>
  );
}

export function Mentions() {
  return (
    <LegalPage eyebrow="Informations légales" title="Mentions légales">
      <h2>Vendeur et éditeur du site</h2>
      {seller ? (
        <>
          <p>Mon Joli Bola est une marque exploitée par <strong>{seller.name}</strong>, {seller.form}, immatriculée auprès de la {seller.authority}, {seller.registration}{seller.capital ? `, capital ${seller.capital}` : ""}.</p>
          <p>Siège : {seller.address}.</p>
          <p>Directeur de la publication : {seller.director}.</p>
          <p>Contact : {seller.email ?? TODO("e-mail et téléphone de contact")}</p>
        </>
      ) : <p>{TODO("dénomination sociale, forme, siège, n° d’immatriculation, directeur de la publication, e-mail, téléphone")}</p>}
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
      <p>{seller ? `${seller.name}, ${seller.form}, ${seller.registration}, ${seller.address}. Le vendeur est établi hors de l’Union européenne.` : TODO("identité complète du vendeur")}</p>
      {seller && !seller.email && <p>Contact : {TODO("e-mail et téléphone du service client")}</p>}
      <h2>Produits et prix</h2>
      <p>Les prix sont indiqués en euros, toutes taxes comprises, hors frais de livraison éventuels annoncés avant paiement.</p>
      <h2>Commande et paiement</h2>
      <p>La commande est confirmée après acceptation du paiement et envoi d’un e-mail de confirmation.</p>
      <h2>Livraison</h2>
      <p>Livraison en France métropolitaine. Délais à confirmer au lancement : {TODO("délais réels de préparation et de transport, tarif sous le seuil de gratuité")}.</p>
      <h2>Droit de rétractation</h2>
      <p>Vous disposez de 14 jours à compter de la réception pour vous rétracter, sans motif, via le formulaire de la <a href="/retractation">page dédiée</a>. </p>
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
      <p>{seller ? `${seller.name}, ${seller.address}.` : TODO("identité du responsable de traitement et contact données personnelles")}</p>
      {seller && !seller.email && <p>Contact données personnelles : {TODO("adresse e-mail dédiée")}</p>}
      <h2>Vos droits</h2>
      <p>Accès, rectification, suppression, opposition : écrivez-nous à l’adresse indiquée dans les mentions légales. Vous pouvez aussi saisir la CNIL.</p>
      <h2>Prestataires</h2>
      <p>Hébergement : {hosting.name}. Paiement : Stripe. Envoi d’e-mails : Resend.</p>
      <h2>Cookies</h2>
      <p>Uniquement les cookies nécessaires au panier et au compte. Aucun cookie publicitaire.</p>
    </LegalPage>
  );
}

export async function Retractation() {
  return (
    <LegalPage eyebrow="Service client" title="Rétractation et retours">
      <p>Vous disposez de 14 jours après réception pour vous rétracter. Remplissez ce formulaire, ou écrivez-nous.</p>
      {seller && <p>Vendeur : {seller.name}, {seller.address}.</p>}
      <RetourForm />
    </LegalPage>
  );
}
