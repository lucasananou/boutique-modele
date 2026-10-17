# Nouvelle boutique à partir du modèle

Un seul code, une configuration par boutique dans `src/stores/<id>/`, choisie
au build par `NEXT_PUBLIC_STORE_ID` (vide = `demo`). Une boutique = une app
(Coolify ou autre) + une base Postgres + un compte Stripe + un domaine.

## 1. Générer le squelette

```bash
npm run store:new -- <id> --nom "Nom de la boutique" --domaine domaine.fr [--prefixe ABC]
# --dry-run : liste les fichiers sans rien écrire
# --from <autre-id> : reprend les textes d'une boutique existante au lieu du modèle neutre
```

`<id>` : minuscules, chiffres, tirets (ex. `atelier-lin`). Il devient aussi le
préfixe des clés navigateur et le dossier Cloudinary : **ne plus le changer une
fois en ligne**. `--prefixe` : préfixe des numéros de commande (`ABC-2026-0001`).

Tout est copié du modèle neutre `src/stores/_modele` (jetons `__ID__`,
`__NOM__`, `__DOMAINE__`, `__PREFIXE__` remplacés). Le script liste à la fin
les lignes « À REMPLIR » à réécrire.

| Fichier généré | À faire |
|---|---|
| `src/stores/<id>/config.ts` | contact, accroche, vendeur légal (`seller`), médiateur, couleurs (`theme.colors`), livraison/retours (`commerce`), **langues** (`locales`), **blocs optionnels** (`sections`), catégories de vente additionnelle (`catalog.crossSellCategories`) |
| `fonts.ts` | polices Google (garder les 3 variables CSS) |
| `nav.ts` | menu, mega-menu, pied de page, libellés traduits |
| `images.ts` | visuels Cloudinary de l'accueil et des pages (en attendant : image générée) |
| `redirects.ts` | anciennes URLs d'un site précédent (301) |
| `translations.ts` | textes de l'interface (accueil, fiche produit, panier, e-mails, FAQ…) |
| `pages/*.ts` | pages d'information : `/la-maison`, `/entretien`, `/guide-des-tailles`, `/livraison-retours`, `/rendez-vous`, `/services/sur-mesure` |
| `content/<id>/*.json` | catégories, articles et réglages importés au démarrage (ou saisis dans l'admin) |

### Langues

Le français (sans préfixe d'URL) est toujours servi. `config.locales` liste les
langues actives ; le modèle n'active que `["fr"]`. Dans `translations.ts` et
`pages/*.ts`, `en` et `he` reprennent le français (`en: fr`). Pour activer
l'anglais : remplacer `en: fr` par un objet traduit de même forme (tsc vérifie
les clés), compléter `nav.labels` et `brand.localizedMeta`, puis ajouter `"en"`
à `locales`. Une langue non activée renvoie (301) vers la page française et
n'apparaît ni dans le sélecteur, ni dans le sitemap, ni dans les hreflang.
L'hébreu (`he`, RTL) suit le même mécanisme.

### Blocs optionnels (`config.sections`)

| Clé | Bloc | Textes |
|---|---|---|
| `productHighlights` | bandeau « points forts » de la fiche produit | `product.highlights*` |
| `valuesBand` | bande « engagements » de l'accueil | `homePage.values` |
| `homeFaq` | FAQ de l'accueil + balisage FAQPage | `homePage.faq` |

Le carrousel d'avis de l'accueil n'apparaît que si `src/data/testimonials.ts`
contient des photos (vrais avis uniquement) ; la mention « ★★★★★ » de la fiche
produit seulement si `product.satisfied` est renseigné.

### Contrôle

`npx tsc --noEmit` vérifie toutes les boutiques (type `StoreConfig` et schéma
des textes calqué sur `src/stores/_modele`). Build local :
`NEXT_PUBLIC_STORE_ID=<id> npm run build`. Le build réécrit
`src/stores/current.ts` et `current-fonts.ts` : ne pas les commiter pour une
autre boutique que celle par défaut (`node scripts/select-store.mjs` remet
`demo`).

Ajouter un texte à toutes les boutiques : ajouter la clé dans
`src/stores/_modele/translations.ts` (schéma de référence), puis dans chaque
`src/stores/<id>/translations.ts`.

## 2. Infrastructure : plan à exécuter à la main

```bash
npm run store:plan -- <id> --depot owner/repo [--branche main]
```

Affiche, sans rien exécuter ni appeler, les commandes à lancer dans l'ordre :

1. base Postgres dédiée (API Coolify) ;
2. application Coolify sur le dépôt et la branche indiqués ;
3. webhook Stripe `https://<domaine>/api/webhooks/stripe` (événements
   `checkout.session.completed`, `checkout.session.expired`,
   `payment_intent.succeeded`, `charge.refunded`) : le `whsec_…` renvoyé une
   seule fois devient `STRIPE_WEBHOOK_SECRET` ;
4. variables d'environnement (les `NEXT_PUBLIC_*` en « Build Variable »,
   `NEXT_PUBLIC_STORE_ID=<id>`) ;
5. DNS et domaine d'envoi Resend (SPF, DKIM) ;
6. premier déploiement.

Les appels Coolify suivent l'API v4 (`/api/v1`) : vérifier les noms de champs
contre la version installée avant la première utilisation. Prévoir aussi les
deux tâches planifiées : `POST /api/live/cleanup` et `POST /api/carts/relance`
avec l'en-tête `x-cron-secret` (`LIVE_CLEANUP_SECRET`, `CART_RELANCE_SECRET`).

## 3. Premier démarrage

Le démarrage (`npm start`) applique les migrations (`prisma migrate deploy`,
dossier `prisma/migrations`) puis importe `content/<id>/*.json`
(`scripts/store-content-sync.cjs`, idempotent). Ensuite, dans le conteneur :

```bash
npm run admin:create -- proprietaire@domaine.fr --name "Prénom Nom"
```

Le mot de passe généré s'affiche une fois. Les e-mails de `ADMIN_EMAILS` ne
peuvent pas être pris par l'inscription publique.

`npm run db:seed` installe le catalogue de démonstration (3 produits sans
photo) : **base vide uniquement**, il purge les produits existants.

Évolution du schéma : modifier `prisma/schema.prisma`, lancer
`npm run db:migrate -- --name <nom>` sur une base locale, commiter le dossier
`prisma/migrations/<date>_<nom>` ; il sera appliqué au prochain démarrage de
chaque boutique.

## 4. Vérifications

Paiement test, e-mails reçus, `/robots.txt`, `/sitemap.xml`, JSON-LD d'une
fiche, `/admin` accessible au propriétaire et refusé à un compte cliente, pages
légales (vendeur, médiateur) complètes, plus aucun « À REMPLIR » à l'écran :

```bash
grep -rn "À REMPLIR" src/stores/<id>/
curl -s https://<domaine>/ | grep -io "à remplir"
```

## 5. Options de vente (facultatives, `config.ts`)

| Clé | Effet |
|---|---|
| `catalogCurrency: "USD"` | prix du catalogue saisis et facturés en dollars (défaut : euros) |
| `commerce.shipsTo: ["US"]` | le checkout refuse toute autre destination ; « US » impose État (50 + DC) et ZIP, refuse PO box / APO |
| `commerce.shipping` | frais de port fixes + seuil de gratuité (unités mineures) ; absent = livraison offerte |
| `subscriptions` | abonnements Stripe Billing : remise %, fréquences en jours, port offert. Une ligne `intervalDays` dans `/api/checkout` → Checkout en mode `subscription`. Gestion : sauter / décaler (`trial_end`) / résilier (`cancel_at_period_end`) via `src/lib/subscriptions.ts`, portail client Stripe pour la carte. Admin > Abonnements |
| `fulfillment` | expédition par un fournisseur (ex. Supliful) : admin > **Expéditions** liste les commandes payées à transmettre, champs prêts à copier, « transmise », puis suivi → e-mail d'expédition. `ProductVariant.units` = unités physiques par variante (pack de 2 = 2) |
| `emailTheme` | couleurs et police des e-mails |
| `front` | **vitrine sur mesure** (voir ci-dessous) |

Webhook Stripe : ajouter les événements `invoice.paid` (renouvellements → nouvelle commande), `invoice.upcoming` (rappel avant renouvellement), `customer.subscription.updated` et `customer.subscription.deleted`.

Mode démo (sans `STRIPE_SECRET_KEY`) : la commande est validée sans paiement, l'abonnement créé en base. `EMAIL_LOG_DIR=/chemin` écrit chaque e-mail non envoyé en fichier HTML.

Produits initiaux : `content/<id>/products.json` (produit, variantes avec `units` et `priceDelta`, images, détails), créés au démarrage s'ils n'existent pas.

### Vitrine sur mesure (`src/stores/<id>/front/index.tsx`)

Pour une marque dont le design ne suit pas les pages du modèle (ex. FIRST DRAW) : le dossier `front/` exporte un `StoreFront` (`src/stores/front.ts`) : layout, pages par chemin (`resolve`), 404, métadonnées, classes du `<html>` (polices). `scripts/select-store.mjs` génère `src/stores/current-front.ts`. Le proxy réécrit alors toutes les URL publiques vers `/vitrine/<chemin>` (URL affichée inchangée) ; `/admin`, `/api`, `/_next` restent au modèle. Le layout racine rend un document nu : ni Tailwind ni composants du modèle sur la vitrine (ses propres styles, importés par `front/index.tsx`). Config : `front.locale` (langue des commandes et e-mails), `front.paths` (connexion, compte, checkout, confirmation, gestion d'abonnement). La vitrine appelle `/api/checkout` et lit la base comme le modèle.

⚠️ Next 16.3 : lancer `next start -H localhost` (ou sans `-H`), **pas** `-H 127.0.0.1` : sinon toute réécriture du proxy devient un proxy HTTP externe (erreurs 500 « Failed to proxy »). En local, ouvrir `http://localhost:<port>` (le dev refuse l'origine 127.0.0.1 : pas d'hydratation).
