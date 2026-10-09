#!/usr/bin/env node
/*
 * Comptes d'administration (provisioning d'une boutique, gestion des droits).
 *
 *   npm run admin:create -- <email> [--name "Prénom Nom"] [--role OWNER|STAFF] [--reset-password]
 *   npm run admin:role   -- <email> <OWNER|STAFF|CUSTOMER>
 *
 * admin:create crée le compte (ou promeut un compte existant). Mot de passe :
 * variable ADMIN_PASSWORD si fournie, sinon généré et affiché UNE fois dans le
 * terminal de l'opérateur (à changer / stocker dans le gestionnaire). Un compte
 * existant garde son mot de passe sauf --reset-password.
 *
 * Remplace prisma/seed-admin.cjs (ancien compte de démo à mot de passe fixe,
 * supprimé du modèle).
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const { PrismaClient } = require("../src/generated/prisma");
const { hash } = require("bcryptjs");

const ROLES = ["OWNER", "STAFF", "CUSTOMER"];

function usage(msg) {
  if (msg) console.error(`✗ ${msg}`);
  console.error(
    "Usage :\n  admin:create -- <email> [--name \"Nom\"] [--role OWNER|STAFF] [--reset-password]\n  admin:role   -- <email> <OWNER|STAFF|CUSTOMER>",
  );
  process.exit(1);
}

function option(args, name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

async function create(prisma, args) {
  const email = (args[0] || "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) usage("e-mail invalide");
  const role = (option(args, "--role") || "OWNER").toUpperCase();
  if (!["OWNER", "STAFF"].includes(role)) usage("rôle admin invalide");
  const name = option(args, "--name") || "Administration";
  const reset = args.includes("--reset-password");

  const existing = await prisma.user.findUnique({ where: { email } });
  let password;
  if (!existing || reset) {
    password = process.env.ADMIN_PASSWORD || crypto.randomBytes(12).toString("base64url");
    if (password.length < 12) usage("ADMIN_PASSWORD : 12 caractères minimum");
  }
  const passwordHash = password ? await hash(password, 12) : undefined;

  await prisma.user.upsert({
    where: { email },
    update: { role, ...(passwordHash ? { passwordHash } : {}), emailVerified: existing?.emailVerified ?? new Date() },
    create: { email, name, role, passwordHash, emailVerified: new Date() },
  });

  console.log(`✓ ${existing ? "Compte promu" : "Compte créé"} : ${email} (${role})`);
  if (password && !process.env.ADMIN_PASSWORD) {
    console.log(`  Mot de passe généré (affiché une seule fois) : ${password}`);
  }
}

async function setRole(prisma, args) {
  const email = (args[0] || "").trim().toLowerCase();
  const role = (args[1] || "").toUpperCase();
  if (!email || !ROLES.includes(role)) usage();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) usage(`aucun compte ${email}`);
  await prisma.user.update({ where: { email }, data: { role } });
  console.log(`✓ ${email} : ${user.role} → ${role}`);
  if (role === "CUSTOMER" && (process.env.ADMIN_EMAILS || "").toLowerCase().split(",").map((e) => e.trim()).includes(email)) {
    console.log("  ⚠ Cet e-mail est encore dans ADMIN_EMAILS : il sera re-promu à la prochaine visite admin (retirer l'e-mail ou ADMIN_EMAILS_BOOTSTRAP=off).");
  }
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  const prisma = new PrismaClient();
  try {
    if (command === "create") await create(prisma, args);
    else if (command === "role") await setRole(prisma, args);
    else usage();
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
