import { prisma } from "@/lib/db";

/*
 * Droits d'administration — SOURCE DE VÉRITÉ : la colonne `User.role`.
 *
 * `ADMIN_EMAILS` (variable d'environnement) ne sert plus qu'à :
 *  1. l'AMORÇAGE : un compte existant dont l'e-mail y figure est promu OWNER à
 *     sa première connexion (reprise d'une base où les comptes admin existent
 *     déjà) ;
 *  2. les destinataires des alertes (nouvelle commande, chat) ;
 *  3. le BLOCAGE de l'inscription publique avec ces adresses : personne ne
 *     peut créer, avant le propriétaire, un compte portant l'e-mail admin
 *     d'une boutique neuve (faille de l'audit §1.12). Le compte propriétaire
 *     se crée avec `npm run admin:create`.
 *
 * Retirer un e-mail de ADMIN_EMAILS ne rétrograde PAS un compte déjà promu :
 * utiliser `npm run admin:role -- <email> CUSTOMER`.
 */

export const ADMIN_ROLES = ["OWNER", "STAFF"] as const;

/** E-mails déclarés dans ADMIN_EMAILS (minuscules). */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** L'e-mail est réservé à l'administration (inscription publique interdite). */
export function isReservedAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return adminEmails().includes(email.trim().toLowerCase());
}

function isAdminRole(role?: string | null): boolean {
  return (ADMIN_ROLES as readonly string[]).includes(role ?? "");
}

/**
 * Rôle effectif d'un compte, avec amorçage depuis ADMIN_EMAILS (promotion
 * OWNER persistée en base, une seule fois).
 */
export async function resolveRole(user: {
  id: string;
  email: string;
  role: string;
}): Promise<string> {
  if (isAdminRole(user.role)) return user.role;
  if (process.env.ADMIN_EMAILS_BOOTSTRAP !== "off" && isReservedAdminEmail(user.email)) {
    await prisma.user.update({ where: { id: user.id }, data: { role: "OWNER" } });
    console.info(`[admin] compte ${user.email} promu OWNER (amorçage ADMIN_EMAILS)`);
    return "OWNER";
  }
  return user.role;
}

/** Vérifie en base que l'utilisateur a un rôle admin (révocation immédiate). */
export async function isAdminUserId(userId?: string | null): Promise<boolean> {
  if (!userId) return false;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true },
  });
  if (!user) return false;
  return isAdminRole(await resolveRole(user));
}
