#!/usr/bin/env node
/*
 * Crée le squelette d'une nouvelle boutique du modèle :
 *
 *   npm run store:new -- <id> [--nom "Ma Boutique"] [--domaine ma-boutique.fr]
 *                            [--prefixe MAB] [--from <autre-boutique>] [--dry-run]
 *
 * Génère, sans rien toucher d'autre :
 *   src/stores/<id>/config.ts, fonts.ts, nav.ts, images.ts, redirects.ts,
 *   translations.ts, pages/*.ts
 *       ← modèle neutre src/stores/_modele (jetons __ID__, __NOM__…, textes
 *         « À REMPLIR »)
 *   Avec --from <id> : translations.ts et pages/ sont copiés d'une boutique
 *   existante (nom et domaines remplacés ; les autres mentions de la source
 *   sont listées à la fin, à réécrire à la main).
 *   content/<id>/categories.json, pages.json, settings.json (vides)
 *
 * Aucun appel réseau, aucune base touchée. Sélection de la boutique au build :
 * NEXT_PUBLIC_STORE_ID=<id> (scripts/select-store.mjs).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const storesDir = path.join(root, "src/stores");
const modelDir = path.join(storesDir, "_modele");

function fail(msg) {
  console.error(`store:new — ${msg}`);
  process.exit(1);
}

// --- Arguments ---
const args = process.argv.slice(2);
const opts = { from: "_modele", dryRun: false };
const positional = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--dry-run") opts.dryRun = true;
  else if (a.startsWith("--")) {
    const key = a.slice(2);
    const value = args[++i];
    if (value === undefined) fail(`valeur manquante pour ${a}`);
    opts[key] = value;
  } else positional.push(a);
}
const id = (positional[0] || "").trim().toLowerCase();
if (!id) {
  fail('usage : npm run store:new -- <id> [--nom "Nom"] [--domaine domaine.fr] [--prefixe ABC] [--from <boutique>] [--dry-run]');
}
if (!/^[a-z][a-z0-9-]{1,30}$/.test(id)) fail(`identifiant invalide « ${id} » (minuscules, chiffres, tirets ; 2 à 31 caractères)`);

const targetDir = path.join(storesDir, id);
if (fs.existsSync(targetDir)) fail(`src/stores/${id} existe déjà`);
const contentDir = path.join(root, "content", id);
if (fs.existsSync(contentDir)) fail(`content/${id} existe déjà`);

const fromModel = opts.from === "_modele";
const sourceDir = path.join(storesDir, opts.from);
if (!fs.existsSync(path.join(sourceDir, "translations.ts")) || !fs.existsSync(path.join(sourceDir, "pages"))) {
  fail(`boutique source « ${opts.from} » introuvable ou incomplète (translations.ts, pages/)`);
}

const titleCase = (s) => s.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
const name = (opts.nom || titleCase(id)).trim();
const domain = (opts.domaine || `${id}.fr`).trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
const prefix = (opts.prefixe || id.replace(/[^a-z]/g, "").slice(0, 3)).toUpperCase();
if (!/^[A-Z]{2,6}$/.test(prefix)) fail(`préfixe de commande invalide « ${prefix} » (2 à 6 lettres, --prefixe)`);
if (/["`\\]/.test(name)) fail("le nom ne doit contenir ni guillemet droit, ni accent grave, ni barre oblique inverse");

// --- Boutique source : nom et domaines à remplacer dans les textes copiés ---
const sourceConfig = fs.readFileSync(path.join(sourceDir, "config.ts"), "utf8");
const pick = (re) => (sourceConfig.match(re) || [])[1];
const sourceName = fromModel ? null : pick(/brand:\s*{\s*name:\s*"([^"]+)"/);
const sourceDomains = fromModel
  ? []
  : [pick(/primary:\s*"([^"]+)"/), pick(/intl:\s*"([^"]+)"/)].filter(Boolean);

const replacements = [
  ...(sourceName ? [[sourceName, name]] : []),
  ...sourceDomains.map((d) => [d, domain]),
];
const tokens = { __ID__: id, __NOM__: name, __DOMAINE__: domain, __PREFIXE__: prefix };

const fillTokens = (s) => Object.entries(tokens).reduce((acc, [k, v]) => acc.replaceAll(k, v), s);
const fromSource = (s) =>
  fillTokens(replacements.reduce((acc, [a, b]) => acc.replaceAll(a, b), s));

// --- Fichiers à écrire ---
/** @type {[string, string][]} chemin relatif à la racine → contenu */
const out = [];
for (const file of ["config.ts", "fonts.ts", "nav.ts", "images.ts", "redirects.ts"]) {
  out.push([`src/stores/${id}/${file}`, fillTokens(fs.readFileSync(path.join(modelDir, file), "utf8"))]);
}

const header = (what) =>
  fromModel
    ? `/* ${what} de ${name} (npm run store:new) : réécrire les valeurs « À REMPLIR ». */\n`
    : `/* ${what} de ${name}. Copie initiale des textes de « ${opts.from} » (npm run store:new) : à réécrire. */\n`;

const translations = fs
  .readFileSync(path.join(sourceDir, "translations.ts"), "utf8")
  .replace(/export const \w+ = {/, "export const translations = {");
if (!translations.includes("export const translations = {")) fail("export des traductions introuvable dans la source");
out.push([`src/stores/${id}/translations.ts`, header("Textes de l'interface") + fromSource(translations)]);

for (const file of fs.readdirSync(path.join(sourceDir, "pages")).sort()) {
  if (!file.endsWith(".ts")) continue;
  let src = fs.readFileSync(path.join(sourceDir, "pages", file), "utf8");
  if (file === "index.ts") {
    src = src.replace(/export const \w+ = {/, "export const pages = {");
    if (!src.includes("export const pages = {")) fail("export des pages introuvable dans la source");
  }
  out.push([`src/stores/${id}/pages/${file}`, (file === "index.ts" ? "" : header("Page")) + fromSource(src)]);
}

out.push([`content/${id}/categories.json`, "[]\n"]);
out.push([`content/${id}/pages.json`, "[]\n"]);
out.push([`content/${id}/settings.json`, "{}\n"]);

// --- Écriture ---
for (const [rel, content] of out) {
  if (opts.dryRun) {
    console.log(`(simulation) ${rel}`);
    continue;
  }
  const abs = path.join(root, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content);
  console.log(`créé : ${rel}`);
}

// --- Lignes à réécrire : « À REMPLIR » (modèle) ou mentions de la source ---
const needle = fromModel ? /À REMPLIR|TO FILL/ : new RegExp(opts.from.replace(/[^a-z0-9]/g, "."), "i");
/** fichier → numéros de ligne */
const leftovers = new Map();
for (const [rel, content] of out) {
  if (!rel.includes(`/stores/${id}/`)) continue;
  content.split("\n").forEach((line, i) => {
    if (i === 0 && line.includes("(npm run store:new)")) return; // en-tête ajouté ici
    if (!needle.test(line)) return;
    if (!leftovers.has(rel)) leftovers.set(rel, []);
    leftovers.get(rel).push(i + 1);
  });
}
const leftoverCount = [...leftovers.values()].reduce((n, l) => n + l.length, 0);
const leftoverList = [...leftovers]
  .map(([rel, lines]) => `     ${rel} : ${lines.length} (l. ${lines.slice(0, 12).join(", ")}${lines.length > 12 ? ", …" : ""})`)
  .join("\n");

console.log(`
Boutique « ${id} » : ${name} — ${domain} — commandes ${prefix}-AAAA-NNNN.

À faire (docs/NOUVELLE-BOUTIQUE.md) :
  1. ${
    fromModel
      ? `${leftoverCount} ligne(s) « À REMPLIR » à réécrire`
      : `${leftoverCount} ligne(s) mentionnent encore « ${opts.from} »`
  }${leftoverCount ? ` :\n${leftoverList}` : "."}
     Config : contact, vendeur (seller), médiateur, couleurs, langues (locales), blocs (sections).
  2. Vérifier : npx tsc --noEmit (contrôle toutes les boutiques), puis NEXT_PUBLIC_STORE_ID=${id} npm run build
     (le build réécrit src/stores/current*.ts : ne pas les commiter ; « node scripts/select-store.mjs » revient à la boutique par défaut).
  3. Catégories et contenus : admin > Catégories / Contenus, ou content/${id}/*.json (importés au démarrage).`);
