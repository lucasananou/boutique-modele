import { PrismaClient } from "@/generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Plafonne le pool de connexions Prisma.
 *
 * Sans limite, Prisma ouvre (2 × CPU + 1) connexions par client. Or `next build`
 * génère les pages statiques dans PLUSIEURS processus, chacun avec son propre
 * client : les pools se cumulent et dépassent les 100 connexions de Postgres
 * (« FATAL: sorry, too many clients already »), ce qui fait échouer le build.
 * On serre donc fort pendant le build, et on garde une marge au runtime où il
 * n'y a qu'un seul processus serveur.
 */
function pooledUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url || url.includes("connection_limit=")) return url;
  const limit = process.env.NEXT_PHASE === "phase-production-build" ? 3 : 10;
  return `${url}${url.includes("?") ? "&" : "?"}connection_limit=${limit}`;
}

const datasourceUrl = pooledUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(datasourceUrl ? { datasourceUrl } : {}),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
