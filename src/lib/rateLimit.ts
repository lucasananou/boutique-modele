/*
 * Limiteur de débit EN MÉMOIRE (fenêtre glissante), clé par IP.
 *
 * Adapté à une instance VPS unique : l'état vit dans le process Node. Sur une
 * flotte multi-instances il faudrait un backend partagé (Redis) — ici une seule
 * instance derrière le reverse-proxy, la mémoire suffit.
 *
 * Algorithme : on conserve, par clé, la liste des horodatages des requêtes
 * tombant dans la fenêtre. On purge les plus anciens à chaque appel puis on
 * compare le compte à la limite. Simple, précis, sans dépendance.
 */

interface Bucket {
  /** Horodatages (ms) des hits encore dans la fenêtre, ordre croissant. */
  hits: number[];
  /** Dernier accès — sert au nettoyage périodique des buckets inactifs. */
  updatedAt: number;
}

// Registre global des buckets. `globalThis` pour survivre au HMR en dev
// (sinon chaque rechargement de module repartirait de zéro).
const store: Map<string, Bucket> = ((
  globalThis as typeof globalThis & { __rateLimitStore?: Map<string, Bucket> }
).__rateLimitStore ??= new Map());

// Nettoyage paresseux : on purge les buckets inactifs de temps en temps pour
// éviter une croissance mémoire non bornée (beaucoup d'IP distinctes).
let lastSweep = 0;
const SWEEP_INTERVAL_MS = 60_000;

function sweep(now: number, maxIdleMs: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, bucket] of store) {
    if (now - bucket.updatedAt > maxIdleMs) store.delete(key);
  }
}

export interface RateLimitOptions {
  /** Nombre maximum de requêtes autorisées dans la fenêtre. */
  limit: number;
  /** Taille de la fenêtre glissante, en millisecondes. */
  windowMs: number;
}

export interface RateLimitResult {
  /** `true` si la requête est autorisée, `false` si la limite est dépassée. */
  ok: boolean;
  /** Requêtes restantes dans la fenêtre courante (0 si bloqué). */
  remaining: number;
  /** Secondes à attendre avant un nouvel essai (pour l'en-tête `Retry-After`). */
  retryAfter: number;
}

/**
 * Enregistre un hit pour `key` et indique s'il est dans la limite.
 * Chaque appel compte comme une tentative (à n'appeler qu'une fois par requête).
 */
export function rateLimit(
  key: string,
  { limit, windowMs }: RateLimitOptions,
): RateLimitResult {
  const now = Date.now();
  sweep(now, windowMs * 2);

  const bucket = store.get(key) ?? { hits: [], updatedAt: now };
  const windowStart = now - windowMs;

  // Purge des hits sortis de la fenêtre.
  const recent = bucket.hits.filter((t) => t > windowStart);

  if (recent.length >= limit) {
    // Bloqué : la fenêtre se libère quand le plus ancien hit expire.
    const oldest = recent[0] ?? now;
    const retryAfter = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    bucket.hits = recent;
    bucket.updatedAt = now;
    store.set(key, bucket);
    return { ok: false, remaining: 0, retryAfter };
  }

  recent.push(now);
  bucket.hits = recent;
  bucket.updatedAt = now;
  store.set(key, bucket);

  return { ok: true, remaining: Math.max(0, limit - recent.length), retryAfter: 0 };
}

/**
 * Lit l'IP client à partir des en-têtes du reverse-proxy.
 * `x-forwarded-for` peut contenir une liste « client, proxy1, proxy2 » → on
 * prend la première. Repli sur `x-real-ip`. `"unknown"` en dernier recours
 * (regroupe alors les requêtes sans IP identifiable sous une même clé).
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;
  return "unknown";
}
