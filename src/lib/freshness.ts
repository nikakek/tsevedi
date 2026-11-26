/** After this many days without confirmation a listing shows a "may be outdated" warning. */
export const STALE_AFTER_DAYS = 60;
/** After this many days it is left out of search results (still reachable by direct link). */
export const HIDE_AFTER_DAYS = 180;

export type Freshness = "fresh" | "stale" | "expired" | "unknown";

const DAY_MS = 24 * 60 * 60 * 1000;

/** The most recent sign that the listing is accurate: admin confirmation or a successful ride report. */
export function lastVerifiedAt(
  lastConfirmedAt: Date | null,
  latestWorkedRide: Date | null,
): Date | null {
  if (!lastConfirmedAt) return latestWorkedRide;
  if (!latestWorkedRide) return lastConfirmedAt;
  return lastConfirmedAt > latestWorkedRide ? lastConfirmedAt : latestWorkedRide;
}

export function daysSince(date: Date, now = new Date()): number {
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / DAY_MS));
}

export function freshness(verifiedAt: Date | null, now = new Date()): Freshness {
  if (!verifiedAt) return "unknown";
  const days = daysSince(verifiedAt, now);
  if (days > HIDE_AFTER_DAYS) return "expired";
  if (days > STALE_AFTER_DAYS) return "stale";
  return "fresh";
}
