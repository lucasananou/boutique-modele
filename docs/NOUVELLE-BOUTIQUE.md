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
