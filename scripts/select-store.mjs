#!/usr/bin/env node
/*
 * Sélectionne la boutique compilée : écrit src/stores/current.ts pour
 * NEXT_PUBLIC_STORE_ID (défaut « demo »). Lancé avant `next dev` / `next
 * build` (predev, prebuild). Une seule boutique est ainsi incluse dans le
 * bundle, quel que soit le nombre de boutiques du modèle.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const id = (process.env.NEXT_PUBLIC_STORE_ID || "demo").trim().toLowerCase();
if (!/^[a-z0-9-]+$/.test(id)) {
  console.error(`NEXT_PUBLIC_STORE_ID invalide : « ${id} »`);
  process.exit(1);
}
const configFile = path.join(root, "src/stores", id, "config.ts");
const fontsFile = path.join(root, "src/stores", id, "fonts.ts");
if (!fs.existsSync(configFile) || !fs.existsSync(fontsFile)) {
  const available = fs
    .readdirSync(path.join(root, "src/stores"), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  console.error(`Boutique « ${id} » introuvable ou incomplète (src/stores/${id}/config.ts et fonts.ts). Disponibles : ${available.join(", ")}`);
  process.exit(1);
}
const header = "// Généré par scripts/select-store.mjs (NEXT_PUBLIC_STORE_ID) : ne pas modifier à la main.\n";
const files = {
  "src/stores/current.ts": `${header}export { config as store } from "./${id}/config";\n`,
  // Polices : importé uniquement par src/app/layout.tsx (next/font, déclarations statiques).
  "src/stores/current-fonts.ts": `${header}export { fontVariables } from "./${id}/fonts";\n`,
};
let changed = false;
for (const [rel, content] of Object.entries(files)) {
  const target = path.join(root, rel);
  if (!fs.existsSync(target) || fs.readFileSync(target, "utf8") !== content) {
    fs.writeFileSync(target, content);
    changed = true;
  }
}
if (changed) console.log(`[boutique] ${id} sélectionnée`);
