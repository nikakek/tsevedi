import { ok } from "../_lib/http";
import { getPlaces } from "@/server/queries";

/** GET /api/v1/places: every place with names in ka/en/ru, aliases and coordinates. */
export async function GET() {
  return ok(await getPlaces());
}
