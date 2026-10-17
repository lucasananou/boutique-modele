import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Client Prisma GÉNÉRÉ (code machine, non maintenu à la main) — ignoré.
    // Seul le code généré est exclu : aucun fichier métier n'est ignoré et
    // aucune règle n'est désactivée globalement.
    "src/generated/**",
  ]),
  // Scripts CommonJS (.cjs) : `require` est le système de modules correct
  // pour ces fichiers Node. Override ciblé par type de fichier (pas global).
  {
    files: ["**/*.cjs"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  // Vitrines sur mesure (src/stores/<id>/front) : portage fidèle d'une
  // maquette HTML. Liens <a> = navigations pleine page voulues (les
  // interactions sont branchées par délégation sur le document) ; <img> =
  // images locales déjà dimensionnées, sans loader Cloudinary.
  {
    files: ["src/stores/*/front/**"],
    rules: {
      "@next/next/no-html-link-for-pages": "off",
      "@next/next/no-img-element": "off",
    },
  },
]);

export default eslintConfig;
