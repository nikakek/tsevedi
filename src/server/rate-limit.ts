import "server-only";

/**
 * Fixed-window in-memory rate limiter. Good enough to stop casual spam on a single server;
 * for multiple instances, swap the Map for Redis/Upstash.
 */
const windows = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  if (process.env.DISABLE_RATE_LIMIT === "1") return true;
  const now = Date.now();
  const entry = windows.get(key);
  if (!entry || entry.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    if (windows.size > 10_000) {
      for (const [k, v] of windows) if (v.resetAt <= now) windows.delete(k);
    }
    return true;
  }
  entry.count++;
  return entry.count <= limit;
}

/** True if `key` has already used up its budget, without counting this call. */
export function isLimited(key: string, limit: number): boolean {
  if (process.env.DISABLE_RATE_LIMIT === "1") return false;
  const entry = windows.get(key);
  return !!entry && entry.resetAt > Date.now() && entry.count >= limit;
}

export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}
