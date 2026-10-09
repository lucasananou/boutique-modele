import { prisma } from "@/lib/db";

export interface ActiveFlashSale {
  label: string;
  /** Remise mise en avant (en %). */
  percent: number;
  /** Fin du compte à rebours (ISO, sérialisable pour le client). */
  endsAt: string;
}

/**
 * Renvoie la vente flash active et non expirée (countdown pilotable depuis
 * l'admin via la table FlashSale), ou null. `endsAt` est sérialisé en ISO pour
 * pouvoir être passé à un composant client (compte à rebours).
 */
export async function getActiveFlashSale(): Promise<ActiveFlashSale | null> {
  const sale = await prisma.flashSale.findFirst({
    where: { active: true, endsAt: { gt: new Date() } },
    orderBy: { endsAt: "asc" },
  });
  if (!sale) return null;
  return {
    label: sale.label,
    percent: sale.percent,
    endsAt: sale.endsAt.toISOString(),
  };
}
