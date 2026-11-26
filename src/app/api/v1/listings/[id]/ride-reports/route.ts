import { revalidateTag } from "next/cache";
import { invalid, limited, notFound, ok, readJson, tooMany } from "../../../_lib/http";
import { rideReportSchema } from "@/lib/validation";
import { createRideReport } from "@/server/mutations";
import { TAGS } from "@/server/queries";

/** POST /api/v1/listings/:id/ride-reports: { travelDate, outcome, departedAt?, pricePaid?, comment? } */
export async function POST(
  request: Request,
  { params }: RouteContext<"/api/v1/listings/[id]/ride-reports">,
) {
  const { id } = await params;
  const parsed = rideReportSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);
  if (limited(request, "ride-report", 20)) return tooMany();
  const report = await createRideReport(id, parsed.data);
  if (!report) return notFound("Listing");
  revalidateTag(TAGS.listing(id), "max");
  revalidateTag(TAGS.listings, "max");
  return ok(report, { status: 201 });
}
