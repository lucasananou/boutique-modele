import type { MetadataRoute } from "next";
import { requestOrigin } from "@/lib/site";

/**
 * Un robots.txt par domaine : chacun annonce SON sitemap.
 * Un domaine qui pointe vers le sitemap d'un autre revient à lui déclarer que
 * son contenu appartient à quelqu'un d'autre.
 */
export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = await requestOrigin();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Zones privées / techniques : jamais crawlées.
      // (Les URLs filtrées NE sont PAS bloquées ici : on laisse crawler pour
      //  que les balises canonical/noindex soient vues — voir generateMetadata.)
      disallow: ["/admin", "/compte", "/commande", "/api/"],
    },
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
