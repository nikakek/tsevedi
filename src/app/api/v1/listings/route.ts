import { invalid, limited, ok, readJson, tooMany, fail } from "../_lib/http";
import { listingSubmissionSchema } from "@/lib/validation";
import { createListingSubmission, UnknownPlaceError } from "@/server/mutations";

/**
 * POST /api/v1/listings: submit a new route for review. Same fields as the web form;
 * `stops` is an ordered array of place slugs. The listing stays PENDING until approved.
 */
export async function POST(request: Request) {
  const parsed = listingSubmissionSchema.safeParse(await readJson(request));
  if (!parsed.success) return invalid(parsed.error);
  if (limited(request, "submit", 10)) return tooMany();
  try {
    const listing = await createListingSubmission(parsed.data);
    return ok({ id: listing.id, status: "PENDING" }, { status: 201 });
  } catch (error) {
    if (error instanceof UnknownPlaceError) {
      return fail(422, "validation_failed", `Unknown places: ${error.slugs.join(", ")}`, { stops: "stops" });
    }
    throw error;
  }
}
