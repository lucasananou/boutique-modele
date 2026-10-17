"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

/** Marque une commande payée comme transmise au fournisseur (ex. Supliful). */
export async function markOrderForwarded(orderId: string, fulfillmentRef: string) {
  await requireAdmin();
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true } });
  if (!order) return { error: "Commande introuvable" };
  if (order.status !== "PAID") return { error: "Seule une commande payée (pas encore expédiée) peut être transmise" };
  await prisma.order.update({
    where: { id: orderId },
    data: { forwardedAt: new Date(), fulfillmentRef: fulfillmentRef.trim().slice(0, 80) || null },
  });
  revalidate(orderId);
  return { ok: true };
}

/** Annule le marquage « transmise » (erreur de saisie). */
export async function unmarkOrderForwarded(orderId: string) {
  await requireAdmin();
  await prisma.order.update({
    where: { id: orderId },
    data: { forwardedAt: null, fulfillmentRef: null },
  });
  revalidate(orderId);
  return { ok: true };
}

function revalidate(orderId: string) {
  revalidatePath("/admin/expeditions");
  revalidatePath(`/admin/commandes/${orderId}`);
  revalidatePath("/admin/commandes");
}
