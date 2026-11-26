import { ok } from "../_lib/http";
import { getRoutePairs } from "@/server/queries";

/** GET /api/v1/route-pairs: distinct origin → destination pairs with listing counts and lowest price. */
export async function GET() {
  const pairs = await getRoutePairs();
  return ok(pairs.map(({ from, to, count, minPrice }) => ({ from: from.slug, to: to.slug, count, minPrice })));
}
