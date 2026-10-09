#!/usr/bin/env node
/*
 * PLAN de mise en ligne d'une boutique du modèle : affiche les commandes à
 * lancer (Coolify, Stripe, Resend, premier compte), SANS RIEN EXÉCUTER.
 * Ce script ne fait aucun appel réseau et ne lit aucun secret : les jetons
 * apparaissent sous forme de variables ($COOLIFY_TOKEN, $STRIPE_SECRET_KEY…)
 * à fournir par la personne qui lance les commandes.
 *
 *   npm run store:plan -- <id> --depot owner/repo [--branche main]
 *
 * Les appels Coolify suivent l'API v4 (/api/v1) : à vérifier contre la version
 * installée avant la première utilisation (noms de champs des variables).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opts = { branche: "main", depot: "OWNER/REPO" };
const positional = [];
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith("--")) opts[args[i].slice(2)] = args[++i];
  else positional.push(args[i]);
}
const id = (positional[0] || "").trim().toLowerCase();
if (!/^[a-z][a-z0-9-]{1,30}$/.test(id)) {
  console.error("usage : npm run store:plan -- <id> [--branche main] [--depot owner/repo]");
  process.exit(1);
}
const configFile = path.join(root, "src/stores", id, "config.ts");
if (!fs.existsSync(configFile)) {
  console.error(`src/stores/${id}/config.ts introuvable : lancer d'abord npm run store:new -- ${id}`);
  process.exit(1);
}
const config = fs.readFileSync(configFile, "utf8");
const pick = (re, fallback = "") => (config.match(re) || [])[1] || fallback;
const name = pick(/brand:\s*{\s*name:\s*"([^"]+)"/, id);
const domain = pick(/primary:\s*"([^"]+)"/, `${id}.fr`);
const intl = pick(/intl:\s*"([^"]*)"/);
const db = `shop_${id.replace(/-/g, "_")}`;

const stripeEvents = [
  "checkout.session.completed",
  "checkout.session.expired",
  "payment_intent.succeeded",
  "charge.refunded",
];

// Variables de l'app (NEXT_PUBLIC_* : nécessaires AU BUILD → cocher « Build Variable » dans Coolify).
const env = [
  ["NEXT_PUBLIC_STORE_ID", id, "build"],
  ["NEXT_PUBLIC_SITE_URL", `https://${domain}`, "build"],
  ["NEXT_PUBLIC_DOMAIN_FR", domain, "build"],
  ["NEXT_PUBLIC_DOMAIN_INTL", intl, "build"],
  ["NEXT_PUBLIC_ALLOW_INTL_INDEXING", "false", "build"],
  ["NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "pk_live_… (compte Stripe de la boutique)", "build"],
  ["NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", "…", "build"],
  ["NEXT_PUBLIC_GA_ID", "(optionnel)", "build"],
  ["DATABASE_URL", `postgresql://…/${db} (base PROPRE à la boutique)`, "runtime"],
  ["AUTH_SECRET", "$(openssl rand -base64 32) — nouveau, jamais celui d'une autre boutique", "runtime"],
  ["AUTH_URL", `https://${domain}`, "runtime"],
  ["STRIPE_SECRET_KEY", "sk_live_…", "runtime"],
  ["STRIPE_WEBHOOK_SECRET", "whsec_… (étape 3)", "runtime"],
  ["RESEND_API_KEY", "re_…", "runtime"],
  ["EMAIL_FROM", `${name} <commandes@${domain}>`, "runtime"],
  ["CLOUDINARY_CLOUD_NAME", "…", "runtime"],
  ["CLOUDINARY_API_KEY", "…", "runtime"],
  ["CLOUDINARY_API_SECRET", "…", "runtime"],
  ["ADMIN_EMAILS", "proprietaire@…", "runtime"],
  ["LIVE_CLEANUP_SECRET", "$(openssl rand -hex 24)", "runtime"],
  ["CART_RELANCE_SECRET", "$(openssl rand -hex 24)", "runtime"],
];

const pad = Math.max(...env.map(([k]) => k.length));
const q = (s) => `'${s.replace(/'/g, "'\\''")}'`;

console.log(`# Plan de mise en ligne — ${name} (${id}) — ${domain}
# RIEN N'A ÉTÉ EXÉCUTÉ. Relire, puis lancer étape par étape.
# Prérequis : export COOLIFY_URL=https://coolify.… COOLIFY_TOKEN=… (jeton API Coolify)
#             PROJECT_UUID / SERVER_UUID / GITHUB_APP_UUID : ceux du projet Coolify
#             (Coolify > projet > « Configuration »). Dépôt : ${opts.depot}.

## 1. Base de données (une base par boutique)
curl -sS -X POST "$COOLIFY_URL/api/v1/databases/postgresql" \\
  -H "Authorization: Bearer $COOLIFY_TOKEN" -H "Content-Type: application/json" \\
  -d '{"project_uuid":"'"$PROJECT_UUID"'","server_uuid":"'"$SERVER_UUID"'","environment_name":"production",
       "name":"${db}","postgres_db":"${db}","postgres_user":"${db}","instant_deploy":true}'
# → noter l'URL interne de connexion (DATABASE_URL).

## 2. Application (dépôt du modèle, une app par boutique)
curl -sS -X POST "$COOLIFY_URL/api/v1/applications/private-github-app" \\
  -H "Authorization: Bearer $COOLIFY_TOKEN" -H "Content-Type: application/json" \\
  -d '{"project_uuid":"'"$PROJECT_UUID"'","server_uuid":"'"$SERVER_UUID"'","environment_name":"production",
       "github_app_uuid":"'"$GITHUB_APP_UUID"'","git_repository":"${opts.depot}","git_branch":"${opts.branche}",
       "build_pack":"nixpacks","ports_exposes":"3000","name":"${id}","domains":"https://${domain}${intl ? `,https://${intl}` : ""}",
       "instant_deploy":false}'
# → noter l'uuid renvoyé : export APP_UUID=…
# Régler : commande de démarrage (npm start), healthcheck, limites mémoire.

## 3. Webhook Stripe (compte Stripe de la boutique, clé secrète de CE compte)
curl -sS https://api.stripe.com/v1/webhook_endpoints -u "$STRIPE_SECRET_KEY:" \\
  -d url=https://${domain}/api/webhooks/stripe \\
${stripeEvents.map((e) => `  -d "enabled_events[]=${e}"`).join(" \\\n")} \\
  -d description=${q(`${name} (${id})`)}
# → la réponse contient "secret": "whsec_…" (affiché UNE seule fois) = STRIPE_WEBHOOK_SECRET.

## 4. Variables de l'application
# Build = à cocher « Build Variable » (inlinées par next build). Valeurs « … » à remplir.
${env.map(([k, v, w]) => `#   ${k.padEnd(pad)}  ${w === "build" ? "[build]  " : "[runtime]"} ${v}`).join("\n")}
# Par l'API (champ « is_build_time » selon la version de Coolify) :
#   curl -sS -X PATCH "$COOLIFY_URL/api/v1/applications/$APP_UUID/envs/bulk" \\
#     -H "Authorization: Bearer $COOLIFY_TOKEN" -H "Content-Type: application/json" \\
#     -d '{"data":[{"key":"NEXT_PUBLIC_STORE_ID","value":"${id}","is_preview":false}, …]}'

## 5. DNS et e-mails
#   ${domain} (et www) → IP du serveur Coolify ; domaine d'envoi vérifié dans Resend (SPF, DKIM).

## 6. Premier déploiement puis compte propriétaire
curl -sS "$COOLIFY_URL/api/v1/deploy?uuid=$APP_UUID" -H "Authorization: Bearer $COOLIFY_TOKEN"
#   Le démarrage applique les migrations (prisma migrate deploy) et importe content/${id}/*.json.
#   Puis, dans le conteneur de l'app :  npm run admin:create -- proprietaire@${domain}

## 7. Vérifications : docs/NOUVELLE-BOUTIQUE.md § 5.`);
