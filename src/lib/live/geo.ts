interface GeoResult {
  country: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
}

const NULL_GEO: GeoResult = {
  country: null,
  city: null,
  latitude: null,
  longitude: null,
  timezone: null,
};

// In-memory cache pour éviter d'appeler ip-api.com à chaque heartbeat
const cache = new Map<string, { result: GeoResult; ts: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1h

const LOCAL_PREFIXES = ["127.", "192.168.", "10.", "172.16.", "172.17.", "172.18.", "172.19.", "172.2", "172.3", "::1", "localhost"];

function isLocalIp(ip: string): boolean {
  return LOCAL_PREFIXES.some((p) => ip.startsWith(p));
}

export async function fetchGeoForIp(ip: string): Promise<GeoResult> {
  if (!ip || isLocalIp(ip)) return NULL_GEO;

  const now = Date.now();
  const cached = cache.get(ip);
  if (cached && now - cached.ts < CACHE_TTL) return cached.result;

  try {
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,city,lat,lon,timezone`,
      { signal: AbortSignal.timeout(2500) },
    );
    if (!res.ok) return NULL_GEO;
    const data = await res.json();
    if (data.status !== "success") return NULL_GEO;

    const result: GeoResult = {
      country: data.country ?? null,
      city: data.city ?? null,
      latitude: data.lat ?? null,
      longitude: data.lon ?? null,
      timezone: data.timezone ?? null,
    };
    cache.set(ip, { result, ts: now });
    return result;
  } catch {
    return NULL_GEO;
  }
}
