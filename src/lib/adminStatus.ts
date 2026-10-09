/** Métadonnées d'affichage des statuts de commande (DB enum OrderStatus). */

export type OrderStatusKey =
  | "PENDING"
  | "PAID"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export const orderStatusMeta: Record<
  OrderStatusKey,
  { label: string; bg: string; fg: string }
> = {
  PENDING: { label: "En attente", bg: "rgba(176,118,20,0.12)", fg: "#9A6608" },
  PAID: { label: "Payée", bg: "rgba(26,91,255,0.10)", fg: "#1a5bff" },
  SHIPPED: { label: "Expédiée", bg: "rgba(31,138,91,0.13)", fg: "#1F7A52" },
  DELIVERED: { label: "Livrée", bg: "rgba(31,138,91,0.18)", fg: "#155c3e" },
  CANCELLED: {
    label: "Annulée",
    bg: "rgba(20,21,26,0.06)",
    fg: "rgba(20,21,26,0.55)",
  },
  REFUNDED: {
    label: "Remboursée",
    bg: "rgba(196,48,72,0.11)",
    fg: "#A3243B",
  },
};

/** Statuts « argent encaissé et conservé » : seuls comptés dans le CA et le total dépensé. */
export const PAID_STATUSES: OrderStatusKey[] = ["PAID", "SHIPPED", "DELIVERED"];

export function statusMeta(status: string) {
  // Statut inconnu : on l'affiche tel quel plutôt que de le maquiller en
  // « En attente » (c'était le cas de REFUNDED).
  return (
    orderStatusMeta[status as OrderStatusKey] ?? {
      label: status,
      bg: "rgba(20,21,26,0.06)",
      fg: "rgba(20,21,26,0.55)",
    }
  );
}

/** Filtres de la liste des commandes. */
export const orderFilters: { key: string; label: string }[] = [
  { key: "all", label: "Toutes" },
  { key: "PAID", label: "Payées" },
  { key: "SHIPPED", label: "Expédiées" },
  { key: "DELIVERED", label: "Livrées" },
  { key: "REFUNDED", label: "Remboursées" },
  { key: "CANCELLED", label: "Annulées" },
  { key: "PENDING", label: "Paniers non payés" },
];

/** Transitions de statut proposées en détail commande. */
export const statusTransitions: OrderStatusKey[] = [
  "PAID",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

export const productStatusMeta = {
  active: { label: "Publié", bg: "rgba(31,138,91,0.13)", fg: "#1F7A52" },
  review: {
    label: "À retravailler",
    bg: "rgba(76,99,210,0.12)",
    fg: "#3546A6",
  },
  draft: { label: "Brouillon", bg: "rgba(176,118,20,0.12)", fg: "#9A6608" },
  archived: {
    label: "Épuisé",
    bg: "rgba(20,21,26,0.06)",
    fg: "rgba(20,21,26,0.5)",
  },
} as const;
