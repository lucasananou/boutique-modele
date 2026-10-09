Modèle neutre d'une boutique, utilisé par `npm run store:new <id>`
(scripts/store-new.mjs). Ce dossier n'est jamais compilé comme boutique
(`_` : identifiant refusé par scripts/select-store.mjs) mais il est vérifié par
`tsc` et sert de **schéma de référence** : `StoreTranslations` et `StorePages`
(src/stores/types.ts) sont calqués sur `translations.ts` et `pages/` d'ici.
Ajouter une clé de texte = l'ajouter ici, puis dans chaque boutique.

Jetons remplacés à la génération : `__ID__`, `__NOM__`, `__DOMAINE__`,
`__PREFIXE__`. Les valeurs « À REMPLIR » sont à réécrire pour chaque boutique.
