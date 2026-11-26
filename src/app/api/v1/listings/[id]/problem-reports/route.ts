import {
  invalid,
  limited,
  notFound,
  ok,
  readJson,
  tooMany,
  requestUser,
  unauthorized,
} from "../../../_lib/http";
import { problemReportSchema } from "@/lib/validation";
import { createProblemReport } from "@/server/mutations";

/** POST /api/v1/listings/:id/problem-reports: { kind, message? } */
export async function POST(
  request: Request,
  { params }: RouteContext<"/api/v1/listings/[id]/problem-reports">,
) {
  const { id } = await params;
  const user = await requestUser(request);
  if (!user) return unauthorized();
  const parsed = problemReportSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);
  if (limited(request, "problem-report", 20, user.id)) return tooMany();
  const report = await createProblemReport(id, parsed.data, user.id);
  return report ? ok(report, { status: 201 }) : notFound("Listing");
}
