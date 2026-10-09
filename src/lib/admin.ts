import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Session } from "next-auth";
import { adminEmails, isAdminUserId } from "@/lib/roles";

// Destinataires des alertes admin (e-mails) — voir src/lib/roles.ts.
export { adminEmails };

/**
 * Session admin ? Vérifié EN BASE (rôle OWNER/STAFF), pas sur l'e-mail du
 * jeton : un compte rétrogradé perd l'accès à la requête suivante.
 */
export async function isAdminSession(session: Session | null): Promise<boolean> {
  return isAdminUserId(session?.user?.id);
}

/** Raccourci pour les routes API : session courante admin ? */
export async function currentUserIsAdmin(): Promise<boolean> {
  return isAdminSession(await auth());
}

/**
 * Garde des pages et actions admin. Redirige vers la connexion (avec retour
 * admin) sans session, vers l'accueil si le compte n'est pas admin.
 */
export async function requireAdmin(): Promise<Session> {
  const session = await auth();
  if (!session?.user) {
    redirect("/compte/connexion?from=/admin");
  }
  if (!(await isAdminSession(session))) {
    redirect("/?admin=refuse");
  }
  return session;
}
