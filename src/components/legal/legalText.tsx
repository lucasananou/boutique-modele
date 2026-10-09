import Link from "next/link";
import type { ReactNode } from "react";
import { brand } from "@/lib/brand";
import { store } from "@/stores";
import { localizedPath, type Locale } from "@/lib/i18n";

/*
 * Textes légaux en français, générés depuis la configuration de la boutique
 * (vendeur, hébergeur, médiateur, livraison/retours). Communs à toutes les
 * boutiques du modèle : aucune donnée propre à une boutique n'est écrite ici.
 *
 * Textes rédigés pour une vente à distance à des consommateurs résidant en
 * France (Code de la consommation) ; à faire relire par un juriste (voir
 * P0-RAPPORT.md, points ouverts : médiateur, représentant UE RGPD, TVA).
 */

const seller = store.seller;
const legalEmail = seller?.email ?? brand.contact.email;
const { returnDays, freeReturns } = store.commerce;

/** Bandeau pour les versions en/he : le texte français fait foi. */
export function FrenchOnlyNotice({ locale }: { locale: Locale }) {
  if (locale === "fr") return null;
  return (
    <p className="!text-[13px] !text-warm-500 bg-mineral rounded-md p-4">
      {locale === "he"
        ? "הטקסט המשפטי זמין בצרפתית, והגרסה הצרפתית היא המחייבת."
        : "This legal text is provided in French; the French version is the binding one."}
    </p>
  );
}

function SellerIdentity() {
  if (!seller) return <p>{brand.legalName} — {legalEmail}</p>;
  return (
    <p>
      <strong>{seller.name}</strong>, {seller.form}
      <br />
      Immatriculation : {seller.registration} — {seller.authority}
      {seller.capital && (
        <>
          <br />
          Capital : {seller.capital}
        </>
      )}
      <br />
      Siège : {seller.address}
      {seller.vatNumber && (
        <>
          <br />
          N° de TVA : {seller.vatNumber}
        </>
      )}
      <br />
      Contact : <a href={`mailto:${legalEmail}`}>{legalEmail}</a>
    </p>
  );
}

const L = ({ href, locale, children }: { href: string; locale: Locale; children: ReactNode }) => (
  <Link href={localizedPath(href, locale)}>{children}</Link>
);

/* ------------------------------ Mentions légales ------------------------------ */

export function MentionsLegalesText({ locale }: { locale: Locale }) {
  return (
    <>
      <p>
        Le site {brand.name} ({store.domains.primary}) est édité et exploité par le vendeur
        désigné ci-dessous.
      </p>
      <h2>Éditeur du site</h2>
      <SellerIdentity />
      {seller && (
        <>
          <h2>Directeur de la publication</h2>
          <p>{seller.director}</p>
        </>
      )}
      <h2>Hébergement</h2>
      <p>
        <strong>{store.hosting.name}</strong> — {store.hosting.address} —{" "}
        <a href={store.hosting.url} target="_blank" rel="noopener noreferrer">
          {store.hosting.url.replace(/^https?:\/\//, "")}
        </a>
      </p>
      <h2>Propriété intellectuelle</h2>
      <p>
        Les textes, photographies, visuels, logos et la structure du site sont protégés. Toute
        reproduction ou réutilisation, totale ou partielle, sans autorisation écrite préalable est
        interdite.
      </p>
      <h2>Données personnelles et cookies</h2>
      <p>
        Les traitements de données personnelles et l&apos;usage des cookies sont décrits dans la{" "}
        <L href="/confidentialite" locale={locale}>politique de confidentialité</L>.
      </p>
      <h2>Conditions de vente</h2>
      <p>
        Les ventes conclues sur le site sont régies par les{" "}
        <L href="/cgv" locale={locale}>conditions générales de vente</L>.
      </p>
      <h2>Contact</h2>
      <p>
        Pour toute question : <a href={`mailto:${legalEmail}`}>{legalEmail}</a>.
      </p>
    </>
  );
}

/* ------------------------------------ CGV ------------------------------------ */

export function CgvText({ locale }: { locale: Locale }) {
  const name = seller?.name ?? brand.legalName;
  return (
    <>
      <p>
        Les présentes conditions générales de vente (CGV) s&apos;appliquent à toutes les ventes de
        produits conclues sur le site {brand.name} ({store.domains.primary}) entre le vendeur et
        toute personne physique agissant à des fins non professionnelles (le « client »). Elles
        sont accessibles à tout moment sur le site et prévalent sur tout autre document. Le client
        les accepte en validant sa commande.
      </p>

      <h2>1. Vendeur</h2>
      <SellerIdentity />

      <h2>2. Produits</h2>
      <p>
        Les caractéristiques essentielles des produits (composition, coloris, tailles, guide des
        tailles) sont présentées sur chaque fiche. Les photographies sont aussi fidèles que
        possible ; de légères variations de couleur peuvent exister selon l&apos;écran. Les offres
        sont valables dans la limite des stocks disponibles. En cas d&apos;indisponibilité après la
        commande, le client en est informé et remboursé sans délai, au plus tard dans les 14 jours.
      </p>

      <h2>3. Prix</h2>
      <p>
        Les prix sont indiqués en euros, toutes taxes comprises. Le prix applicable est celui
        affiché au moment de la validation de la commande. Les frais de livraison éventuels sont
        indiqués avant le paiement ; la livraison standard est offerte lorsque le site
        l&apos;indique. Un prix barré correspond au prix antérieurement pratiqué par le vendeur.
      </p>

      <h2>4. Commande</h2>
      <p>
        Le client sélectionne les produits, vérifie le contenu de son panier, renseigne ses
        coordonnées et son adresse de livraison, puis valide sa commande avec obligation de
        paiement. Un e-mail de confirmation récapitulant la commande lui est adressé. Le vendeur
        se réserve le droit d&apos;annuler une commande en cas de litige de paiement ou de demande
        anormale ; le client est alors intégralement remboursé.
      </p>

      <h2>5. Paiement</h2>
      <p>
        Le paiement s&apos;effectue en ligne, au moment de la commande, par carte bancaire ou par
        les moyens proposés à l&apos;écran, via le prestataire sécurisé Stripe. Le vendeur
        n&apos;a jamais accès aux données complètes de la carte.
      </p>

      <h2>6. Livraison</h2>
      <p>
        Les produits sont livrés à l&apos;adresse indiquée par le client. Les zones et délais de
        livraison sont précisés sur la page{" "}
        <L href="/livraison-retours" locale={locale}>Livraison &amp; retours</L> et lors de la
        commande. À défaut de délai indiqué, la livraison intervient au plus tard 30 jours après la
        commande. Un numéro de suivi est communiqué par e-mail dès l&apos;expédition. En cas de
        retard, le client peut, après mise en demeure restée sans effet dans un délai
        supplémentaire raisonnable, résoudre le contrat et être remboursé (articles L216-1 et
        suivants du Code de la consommation). Le risque de perte ou d&apos;endommagement est
        transféré au client à la réception du colis.
      </p>

      <h2>7. Droit de rétractation</h2>
      <p>
        Le client dispose d&apos;un délai de 14 jours à compter de la réception des produits pour
        exercer son droit de rétractation, sans avoir à motiver sa décision (articles L221-18 et
        suivants du Code de la consommation).
        {returnDays > 14 &&
          ` À titre commercial, ce délai est porté à ${returnDays} jours.`}{" "}
        Pour l&apos;exercer, il adresse une déclaration dénuée d&apos;ambiguïté par e-mail à{" "}
        <a href={`mailto:${legalEmail}`}>{legalEmail}</a>, ou utilise le{" "}
        <L href="/retractation" locale={locale}>formulaire de rétractation</L>.
      </p>
      <p>
        Les produits sont retournés au plus tard 14 jours après la communication de sa décision,
        non portés, non lavés et avec leurs étiquettes d&apos;origine.{" "}
        {freeReturns
          ? "Les frais de retour sont pris en charge par le vendeur, selon les modalités communiquées par le service client."
          : "Les frais directs de retour sont à la charge du client."}{" "}
        Le vendeur rembourse la totalité des sommes versées, y compris les frais de livraison
        initiaux (hors surcoût d&apos;un mode de livraison plus coûteux choisi par le client),
        dans les 14 jours suivant la communication de la décision de rétractation, avec le même
        moyen de paiement ; il peut différer le remboursement jusqu&apos;à la récupération des
        produits ou la preuve de leur expédition.
      </p>
      <p>
        Le droit de rétractation ne s&apos;applique pas aux biens confectionnés selon les
        spécifications du client ou nettement personnalisés, ni aux biens descellés par le client
        après la livraison qui ne peuvent être renvoyés pour des raisons d&apos;hygiène (article
        L221-28 du Code de la consommation).
      </p>

      <h2>8. Garanties légales</h2>
      <p>
        Le consommateur dispose d&apos;un délai de deux ans à compter de la délivrance du bien pour
        obtenir la mise en œuvre de la garantie légale de conformité en cas d&apos;apparition
        d&apos;un défaut de conformité. Durant un délai de vingt-quatre mois à compter de la
        délivrance du bien, le consommateur n&apos;est tenu d&apos;établir que l&apos;existence du
        défaut de conformité et non la date d&apos;apparition de celui-ci.
      </p>
      <p>
        La garantie légale de conformité donne au consommateur droit à la réparation ou au
        remplacement du bien dans un délai de trente jours suivant sa demande, sans frais et sans
        inconvénient majeur pour lui. Le consommateur peut obtenir une réduction du prix
        d&apos;achat en conservant le bien ou mettre fin au contrat en se faisant rembourser
        intégralement contre restitution du bien, si : le professionnel refuse de réparer ou de
        remplacer le bien ; la réparation ou le remplacement du bien intervient après un délai de
        trente jours ; la réparation ou le remplacement du bien occasionne un inconvénient majeur
        pour le consommateur ; la non-conformité du bien persiste en dépit de la tentative de mise
        en conformité du vendeur restée infructueuse. Le consommateur a également droit à une
        réduction du prix du bien ou à la résolution du contrat lorsque le défaut de conformité est
        si grave qu&apos;il justifie que la réduction du prix ou la résolution du contrat soit
        immédiate. Le consommateur n&apos;est alors pas tenu de demander la réparation ou le
        remplacement du bien au préalable.
      </p>
      <p>
        Tout vendeur qui fait obstacle de mauvaise foi à la mise en œuvre de la garantie légale de
        conformité encourt une amende civile d&apos;un montant maximal de 300 000 euros, qui peut
        être porté jusqu&apos;à 10 % du chiffre d&apos;affaires moyen annuel (article L241-5 du
        Code de la consommation).
      </p>
      <p>
        Le consommateur bénéficie également de la garantie légale des vices cachés en application
        des articles 1641 à 1649 du Code civil, pendant une durée de deux ans à compter de la
        découverte du défaut. Cette garantie donne droit à une réduction de prix si le bien est
        conservé ou à un remboursement intégral contre restitution du bien.
      </p>
      <p>
        Pour mettre en œuvre ces garanties, le client écrit à{" "}
        <a href={`mailto:${legalEmail}`}>{legalEmail}</a> en précisant sa commande et le défaut
        constaté.
      </p>

      <h2>9. Responsabilité</h2>
      <p>
        Le vendeur est responsable de plein droit de la bonne exécution des obligations résultant
        du contrat. Sa responsabilité ne saurait être engagée en cas de fait du client, de fait
        imprévisible et insurmontable d&apos;un tiers au contrat ou de force majeure.
      </p>

      <h2>10. Données personnelles</h2>
      <p>
        Les données du client sont traitées par {name} pour la gestion des commandes et de la
        relation client, conformément à la{" "}
        <L href="/confidentialite" locale={locale}>politique de confidentialité</L>.
      </p>

      <h2>11. Service client et réclamations</h2>
      <p>
        Pour toute question ou réclamation : <a href={`mailto:${legalEmail}`}>{legalEmail}</a>.
      </p>

      {store.mediator && (
        <>
          <h2>12. Médiation</h2>
          <p>
            Conformément aux articles L611-1 et suivants du Code de la consommation, en cas de
            litige non résolu par le service client, le client peut recourir gratuitement au
            médiateur de la consommation : {store.mediator.name}, {store.mediator.address} —{" "}
            <a href={store.mediator.url} target="_blank" rel="noopener noreferrer">
              {store.mediator.url.replace(/^https?:\/\//, "")}
            </a>
            . Le client doit au préalable avoir adressé une réclamation écrite au vendeur.
          </p>
        </>
      )}

      <h2>{store.mediator ? "13" : "12"}. Droit applicable</h2>
      <p>
        Les présentes CGV sont soumises au droit français, sans préjudice des dispositions
        impératives plus protectrices de la loi du pays de résidence habituelle du consommateur.
        En cas de litige, le consommateur peut saisir, à son choix, la juridiction du lieu où il
        demeurait au moment de la conclusion du contrat ou de la survenance du fait dommageable,
        ou toute autre juridiction compétente.
      </p>
    </>
  );
}

/* ----------------------------- Confidentialité ----------------------------- */

export function ConfidentialiteText({ locale }: { locale: Locale }) {
  const name = seller?.name ?? brand.legalName;
  return (
    <>
      <p>
        Cette politique explique comment vos données personnelles sont collectées et traitées
        lorsque vous naviguez sur {store.domains.primary}, créez un compte, écrivez au service
        client ou passez commande, conformément au règlement général sur la protection des
        données (RGPD) et à la loi Informatique et Libertés.
      </p>
      <h2>Responsable du traitement</h2>
      <SellerIdentity />
      <h2>Données collectées</h2>
      <ul>
        <li>Compte : nom, e-mail, mot de passe chiffré, téléphone s&apos;il est fourni.</li>
        <li>Commandes : coordonnées et adresse de livraison, articles commandés, montants, suivi du colis.</li>
        <li>Échanges : messages envoyés via le chat ou par e-mail, inscription à la newsletter.</li>
        <li>
          Navigation : pages consultées, contenu du panier et données techniques ; les traceurs de
          mesure d&apos;audience ne sont activés qu&apos;avec votre consentement.
        </li>
      </ul>
      <p>Les données de carte bancaire sont traitées directement par Stripe et ne nous sont jamais transmises.</p>
      <h2>Finalités et bases légales</h2>
      <ul>
        <li>Traitement et livraison des commandes, service après-vente : exécution du contrat.</li>
        <li>Comptabilité et prévention de la fraude : obligation légale et intérêt légitime.</li>
        <li>Relance d&apos;un panier non finalisé et sécurité du site : intérêt légitime.</li>
        <li>Newsletter et mesure d&apos;audience : consentement, retirable à tout moment.</li>
      </ul>
      <h2>Destinataires</h2>
      <p>
        Les données sont accessibles aux seules personnes habilitées de {name} et à ses
        prestataires, dans la limite de leurs missions : hébergement ({store.hosting.name},
        France), paiement (Stripe), envoi des e-mails (Resend), stockage des images (Cloudinary),
        mesure d&apos;audience (Google Analytics, après consentement), fournisseurs et
        transporteurs chargés de préparer et d&apos;expédier les colis. Certains de ces
        prestataires sont établis hors de l&apos;Union européenne ; les transferts sont encadrés
        par les clauses contractuelles types de la Commission européenne ou un mécanisme
        équivalent. Le responsable du traitement est lui-même établi hors de l&apos;Union
        européenne.
      </p>
      <h2>Durées de conservation</h2>
      <ul>
        <li>Compte client : jusqu&apos;à sa suppression, ou 3 ans après la dernière activité.</li>
        <li>Commandes et factures : 10 ans (obligations comptables).</li>
        <li>Prospection (newsletter) : 3 ans après le dernier contact ou jusqu&apos;au désabonnement.</li>
        <li>Cookies de mesure d&apos;audience : 13 mois au plus ; choix de consentement : 6 mois.</li>
      </ul>
      <h2>Vos droits</h2>
      <p>
        Vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de
        limitation, d&apos;opposition et de portabilité, ainsi que du droit de retirer votre
        consentement et de définir des directives sur le sort de vos données après votre décès.
        Écrivez à <a href={`mailto:${legalEmail}`}>{legalEmail}</a>. Vous pouvez introduire une
        réclamation auprès de la CNIL (
        <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">www.cnil.fr</a>).
      </p>
      <h2>Cookies</h2>
      <p>
        Les cookies essentiels (session, panier, sécurité) sont nécessaires au fonctionnement du
        site. Les traceurs de mesure d&apos;audience ne sont déposés qu&apos;après votre accord,
        recueilli par le bandeau affiché lors de la première visite.
      </p>
      <h2>Sécurité</h2>
      <p>
        Mots de passe chiffrés, connexions HTTPS, accès restreints : des mesures techniques et
        organisationnelles adaptées protègent vos données.
      </p>
      <p>
        Voir aussi les <L href="/mentions-legales" locale={locale}>mentions légales</L>.
      </p>
    </>
  );
}

/* -------------------------- Formulaire de rétractation -------------------------- */

export function RetractationText() {
  return (
    <>
      <p>
        Vous pouvez exercer votre droit de rétractation en nous écrivant simplement à{" "}
        <a href={`mailto:${legalEmail}`}>{legalEmail}</a>, ou en recopiant le modèle ci-dessous
        (annexe à l&apos;article R221-1 du Code de la consommation). Délai et modalités : voir
        l&apos;article 7 des conditions générales de vente.
      </p>
      <h2>Formulaire de rétractation</h2>
      <p>
        (Veuillez compléter et renvoyer le présent formulaire uniquement si vous souhaitez vous
        rétracter du contrat.)
      </p>
      <p>
        À l&apos;attention de {seller?.name ?? brand.legalName}
        {seller ? `, ${seller.address}` : ""}, e-mail : {legalEmail} :
      </p>
      <p>
        Je vous notifie par la présente ma rétractation du contrat portant sur la vente du bien
        ci-dessous :
        <br />— Référence de la commande et article(s) concerné(s) :
        <br />— Commandé le / reçu le :
        <br />— Nom du consommateur :
        <br />— Adresse du consommateur :
        <br />— Signature du consommateur (uniquement en cas de notification sur papier) :
        <br />— Date :
      </p>
    </>
  );
}
