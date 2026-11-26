/**
 * Decides whether a listing serves a trip from one place to another.
 *
 * A listing's stops are ordered: [origin, ...intermediate, destination]. A traveller can board at
 * any stop and get off at any later stop. If the driver also runs the trip back (`returnTime`),
 * the reversed order matches too.
 */

export type MatchableListing = {
  stops: Array<{ placeId: string }>;
  returnTime: string | null;
};

export type RouteMatch = {
  direction: "outbound" | "return";
  /** Index of the boarding stop in the listing's own stop order. */
  boardIndex: number;
  /** Index of the stop where the traveller gets off. */
  alightIndex: number;
};

export function matchListing(
  listing: MatchableListing,
  fromPlaceId: string,
  toPlaceId: string,
): RouteMatch | null {
  if (fromPlaceId === toPlaceId) return null;
  const ids = listing.stops.map((stop) => stop.placeId);
  const from = ids.indexOf(fromPlaceId);
  const to = ids.indexOf(toPlaceId);
  if (from === -1 || to === -1) return null;
  if (from < to) return { direction: "outbound", boardIndex: from, alightIndex: to };
  if (listing.returnTime) return { direction: "return", boardIndex: from, alightIndex: to };
  return null;
}

/** Stops in the order the traveller passes them for a given direction. */
export function stopsInTravelOrder<S>(stops: S[], direction: RouteMatch["direction"]): S[] {
  return direction === "outbound" ? stops : [...stops].reverse();
}

/** Sort key for "HH:MM" strings; unparsable values sort last. */
export function minutesOfDay(time: string | null | undefined): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time ?? "");
  if (!match) return Number.MAX_SAFE_INTEGER;
  return Number(match[1]) * 60 + Number(match[2]);
}
