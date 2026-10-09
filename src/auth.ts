import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";
import { multiDomain } from "@/lib/domains";
import { getClientIp, rateLimit } from "@/lib/rateLimit";

// Auth.js self-hosted derrière un proxy (Coolify) : sans AUTH_URL, la base des
// redirections/callbacks retombe sur localhost:3000. On la dérive de
// NEXT_PUBLIC_SITE_URL (réglée par environnement : preview en prod, localhost en dev).
//
// SAUF en multi-domaine : AUTH_URL fige la base sur un seul hôte, donc une
// cliente qui se connecte depuis le domaine international serait renvoyée sur
// le .fr après authentification. `trustHost` ci-dessous suffit alors, Auth.js
// dérivant la base de l'hôte transmis par le proxy.
if (!multiDomain && !process.env.AUTH_URL && process.env.NEXT_PUBLIC_SITE_URL) {
  process.env.AUTH_URL = process.env.NEXT_PUBLIC_SITE_URL;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Derrière le reverse-proxy Coolify/Traefik : faire confiance à l'hôte transmis
  // (X-Forwarded-Host) sinon Auth.js rejette avec « UntrustedHost ».
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/compte/connexion",
  },
  providers: [
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      authorize: async (credentials, request) => {
        const email = String(credentials?.email ?? "").toLowerCase().trim();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        // Anti-force brute AU NIVEAU DU PROVIDER : couvre aussi un appel
        // direct à /api/auth/callback/credentials (la server action de
        // connexion a sa propre limite). Par IP et par compte visé.
        const ip = request ? getClientIp(request.headers) : "unknown";
        if (
          !rateLimit(`auth-ip:${ip}`, { limit: 10, windowMs: 60_000 }).ok ||
          !rateLimit(`auth-email:${email}`, { limit: 20, windowMs: 15 * 60_000 }).ok
        ) {
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const valid = await compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],
  callbacks: {
    // Derrière le proxy, Auth.js peut résoudre les redirections sur localhost.
    // On force la base sur NEXT_PUBLIC_SITE_URL (réglée par environnement).
    //
    // En multi-domaine, on suit au contraire l'hôte de la requête (`baseUrl`,
    // fiable grâce à `trustHost`) : la cliente doit rester sur le domaine
    // depuis lequel elle s'est connectée.
    redirect: ({ url, baseUrl }) => {
      const site = multiDomain ? baseUrl : process.env.NEXT_PUBLIC_SITE_URL || baseUrl;
      if (url.startsWith("/")) return `${site}${url}`;
      try {
        if (new URL(url).origin === new URL(site).origin) return url;
      } catch {
        /* URL invalide → base */
      }
      return site;
    },
    jwt: ({ token, user }) => {
      if (user) token.id = user.id;
      return token;
    },
    session: ({ session, token }) => {
      if (token.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
