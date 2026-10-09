// MapLibre 6 est distribué en ESM : son worker est un fichier séparé que le
// bundler Next ne sait pas localiser. On le copie dans public/maplibre/ (avec le
// module partagé qu'il importe) avant chaque build ; LiveMap y pointe via setWorkerUrl.
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const dist = join(dirname(require.resolve("maplibre-gl/package.json")), "dist");
const dest = join(process.cwd(), "public", "maplibre");
mkdirSync(dest, { recursive: true });
for (const f of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  copyFileSync(join(dist, f), join(dest, f));
}
