# Boutique modèle

Modèle de boutique e-commerce (mode / accessoires) : un seul code, une
configuration par boutique, une base et un compte Stripe par boutique.

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Prisma
(PostgreSQL) · Stripe Checkout · Auth.js · Resend · Cloudinary.

## Démarrage local

```bash
cp .env.example .env            # puis renseigner DATABASE_URL et AUTH_SECRET (npx auth secret)
npm ci
npx prisma migrate deploy       # crée les tables (migrations de prisma/migrations)
npm run db:seed                 # catalogue de démonstration (3 produits) — base vide uniquement
npm run dev                     # http://localhost:3000
npm run admin:create -- vous@exemple.fr --name "Prénom Nom"   # compte propriétaire (/admin)
```

`npm run build` a besoin de `DATABASE_URL` (base migrée) : certaines pages
listent les collections en base au build.

Boutique compilée : `NEXT_PUBLIC_STORE_ID` (défaut `demo`, dossier
`src/stores/demo`). Une seule boutique est incluse par build.

## Créer une boutique

```bash
npm run store:new -- <id> --nom "Nom" --domaine domaine.fr [--prefixe ABC]
```

Procédure complète (textes « À REMPLIR », langues, blocs optionnels,
infrastructure, premier démarrage, vérifications) : **[docs/NOUVELLE-BOUTIQUE.md](docs/NOUVELLE-BOUTIQUE.md)**.

## Organisation

| Dossier | Contenu |
|---|---|
| `src/stores/_modele/` | modèle neutre + **schéma de référence** des textes (jamais compilé comme boutique) |
| `src/stores/<id>/` | config d'une boutique : identité, vendeur légal, domaines, couleurs, polices, menu, textes, langues |
| `content/<id>/` | catégories, articles et réglages importés au démarrage (idempotent) |
| `prisma/` | schéma, migrations (`migrate deploy` au démarrage), seed de démonstration |
| `scripts/` | `store-new`, `select-store`, `store-content-sync`, `store-provision-plan`, `admin-account` |

## Base de données

Le démarrage (`npm start`) lance `prisma migrate deploy`, puis l'import de
`content/<id>/`. Modifier le schéma : éditer `prisma/schema.prisma`, puis
`npm run db:migrate -- --name <nom>` en local et commiter le dossier de
migration créé.

## Commandes utiles

| Commande | Rôle |
|---|---|
| `npx tsc --noEmit` | vérifie le code et la conformité de toutes les boutiques au schéma |
| `npm run build` | build de la boutique sélectionnée |
| `npm run store:plan -- <id> --depot owner/repo` | **affiche** le plan Coolify / Stripe / DNS (n'exécute rien) |
| `npm run admin:role -- <email> OWNER\|STAFF\|CUSTOMER` | change le rôle d'un compte |
| `npm run content:sync` | réimporte `content/<id>/` (sans écraser l'admin) |
