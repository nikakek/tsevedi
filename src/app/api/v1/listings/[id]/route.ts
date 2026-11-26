import { notFound, ok } from "../../_lib/http";
import { getListing } from "@/server/queries";

/** GET /api/v1/listings/:id: an approved listing with its latest traveller reports. */
export async function GET(_: Request, { params }: RouteContext<"/api/v1/listings/[id]">) {
  const { id } = await params;
  const listing = await getListing(id);
  return listing ? ok(listing) : notFound("Listing");
}
