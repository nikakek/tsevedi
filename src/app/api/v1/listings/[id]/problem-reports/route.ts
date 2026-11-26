import { invalid, limited, notFound, ok, readJson, tooMany } from "../../../_lib/http";
import { problemReportSchema } from "@/lib/validation";
import { createProblemReport } from "@/server/mutations";

/** POST /api/v1/listings/:id/problem-reports: { kind, message? } */
export async function POST(request: Request, { params }: RouteContext<"/api/v1/listings/[id]/problem-reports">) {
  const { id } = await params;
  const parsed = problemReportSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);
  if (limited(request, "problem-report", 20)) return tooMany();
  const report = await createProblemReport(id, parsed.data);
  return report ? ok(report, { status: 201 }) : notFound("Listing");
}
