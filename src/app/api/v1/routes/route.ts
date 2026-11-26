import type { NextRequest } from "next/server";
import { fail, ok } from "../_lib/http";
import { isIsoDate } from "@/lib/schedule";
import { getPlaceBySlug, searchRoutes } from "@/server/queries";

/** GET /api/v1/routes?from=tbilisi&to=oni[&date=YYYY-MM-DD] */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const fromSlug = params.get("from");
  const toSlug = params.get("to");
  const date = params.get("date");
  if (!fromSlug || !toSlug)
    return fail(400, "bad_request", "Query parameters `from` and `to` are required");
  if (date && !isIsoDate(date)) return fail(400, "bad_request", "`date` must be YYYY-MM-DD");

  const [from, to] = await Promise.all([getPlaceBySlug(fromSlug), getPlaceBySlug(toSlug)]);
  if (!from || !to) return fail(404, "not_found", "Unknown place");

  const { results, reverseCount } = await searchRoutes(from.id, to.id, date);
  return ok({
    from,
    to,
    date,
    reverseCount,
    results: results.map(({ listing, match, runsOnDate }) => ({
      listing,
      direction: match.direction,
      boardStop: listing.stops[match.boardIndex].slug,
      alightStop: listing.stops[match.alightIndex].slug,
      departureTime: match.direction === "outbound" ? listing.departureTime : listing.returnTime,
      runsOnDate,
    })),
  });
}
