import { store } from "@/stores";

const ADMIN_PATH_RE = /^\/admin(?:\/|$)/i;

function pathnameFromInput(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    return new URL(trimmed, `https://${store.domains.primary}`).pathname;
  } catch {
    return trimmed.startsWith("/") ? trimmed.split(/[?#]/, 1)[0] || "/" : null;
  }
}

export function isAdminAnalyticsPath(value?: string | null): boolean {
  const pathname = pathnameFromInput(value);
  return Boolean(pathname && ADMIN_PATH_RE.test(pathname));
}

export function shouldIgnoreAnalyticsPayload(payload: {
  page?: string | null;
  referrer?: string | null;
}): boolean {
  return isAdminAnalyticsPath(payload.page) || isAdminAnalyticsPath(payload.referrer);
}
