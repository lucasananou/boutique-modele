import Stripe from "stripe";

/**
 * Client Stripe côté serveur. Les clés sont dans .env (clés de test par défaut,
 * à remplacer par celles du client). Si la clé n'est pas configurée, le checkout
 * bascule en mode démonstration (voir l'action de checkout).
 */
const key = process.env.STRIPE_SECRET_KEY;

export const stripe = key ? new Stripe(key) : null;

/** Vrai si Stripe est réellement configuré (clé ≠ placeholder). */
export const isStripeLive = Boolean(key && !key.includes("xxx"));
