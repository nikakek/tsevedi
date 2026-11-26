"use server";

import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { driverInput, routeInput, value } from "@/lib/form-data";
import {
  driverRegistrationSchema,
  driverRouteSchema,
  fieldErrors,
  listingSubmissionSchema,
  problemReportSchema,
  rideReportSchema,
  type ValidationKey,
} from "@/lib/validation";
import { getSavedIds, setSaved, type SavedIds } from "@/server/accounts";
import {
  archiveDriverListing,
  confirmDriverListing,
  createDriverListing,
  getDriverForUser,
  registerDriver,
  updateDriverListing,
} from "@/server/drivers";
import {
  createListingSubmission,
  createProblemReport,
  createRideReport,
  UnknownPlaceError,
} from "@/server/mutations";
import { TAGS } from "@/server/queries";
import { clientIp, rateLimit } from "@/server/rate-limit";
import { getCurrentUser } from "@/server/session";

export type ActionState =
  | { status: "idle" }
  | { status: "success"; id?: string }
  | {
      status: "error";
      errors: Record<string, ValidationKey>;
      reason?: "invalid" | "rate-limited" | "not-found" | "signed-out" | "not-allowed";
    };

const HOUR = 60 * 60 * 1000;
const signedOut: ActionState = { status: "error", errors: {}, reason: "signed-out" };

async function allowed(action: string, key: string, limit: number) {
  return rateLimit(`${action}:${key}:${clientIp(await headers())}`, limit, HOUR);
}

function refreshListings(listingId?: string) {
  updateTag(TAGS.listings);
  if (listingId) updateTag(TAGS.listing(listingId));
}

/** Someone adds a route for a driver they know. Needs an account; the admin reviews it. */
export async function submitListingAction(formData: FormData): Promise<ActionState> {
  // Honeypot: real people never see or fill this field.
  if (value(formData, "website")) return { status: "success" };
  const user = await getCurrentUser();
  if (!user) return signedOut;

  const parsed = listingSubmissionSchema.safeParse({
    ...driverInput(formData),
    ...routeInput(formData),
    submittedByDriver: value(formData, "who") === "driver",
    submitterContact: value(formData, "submitterContact"),
  });
  if (!parsed.success)
    return { status: "error", errors: fieldErrors(parsed.error), reason: "invalid" };
  // Only valid submissions count towards the limit, so typos don't lock people out.
  if (!(await allowed("submit", user.id, 10))) {
    return { status: "error", errors: {}, reason: "rate-limited" };
  }

  try {
    await createListingSubmission(parsed.data, user.id);
  } catch (error) {
    if (error instanceof UnknownPlaceError) {
      return { status: "error", errors: { stops: "stops" }, reason: "invalid" };
    }
    throw error;
  }
  return { status: "success" };
}

export async function rideReportAction(
  listingId: string,
  formData: FormData,
): Promise<ActionState> {
  if (value(formData, "website")) return { status: "success" };
  const user = await getCurrentUser();
  if (!user) return signedOut;
  if (!(await allowed("ride-report", user.id, 20))) {
    return { status: "error", errors: {}, reason: "rate-limited" };
  }

  const parsed = rideReportSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { status: "error", errors: fieldErrors(parsed.error), reason: "invalid" };

  const report = await createRideReport(listingId, parsed.data, user.id);
  if (!report) return { status: "error", errors: {}, reason: "not-found" };
  refreshListings(listingId);
  return { status: "success" };
}

export async function problemReportAction(
  listingId: string,
  formData: FormData,
): Promise<ActionState> {
  if (value(formData, "website")) return { status: "success" };
  const user = await getCurrentUser();
  if (!user) return signedOut;
  if (!(await allowed("problem-report", user.id, 20))) {
    return { status: "error", errors: {}, reason: "rate-limited" };
  }

  const parsed = problemReportSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return { status: "error", errors: fieldErrors(parsed.error), reason: "invalid" };

  const report = await createProblemReport(listingId, parsed.data, user.id);
  if (!report) return { status: "error", errors: {}, reason: "not-found" };
  return { status: "success" };
}

// --- Saving ----------------------------------------------------------------------------------

export async function getSavedAction(): Promise<SavedIds | null> {
  const user = await getCurrentUser();
  return user ? getSavedIds(user.id) : null;
}

export async function setSavedAction(type: "driver" | "listing", id: string, saved: boolean) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const };
  await setSaved(user.id, type, id, saved);
  return { ok: true as const };
}

// --- Drivers -----------------------------------------------------------------------------------

export async function registerDriverAction(formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return signedOut;
  const parsed = driverRegistrationSchema.safeParse(driverInput(formData));
  if (!parsed.success)
    return { status: "error", errors: fieldErrors(parsed.error), reason: "invalid" };
  await registerDriver(user.id, parsed.data);
  return { status: "success" };
}

/** The signed-in user's driver profile, only if the admin has approved it. */
async function approvedDriver() {
  const user = await getCurrentUser();
  if (!user) return null;
  const driver = await getDriverForUser(user.id);
  return driver?.status === "APPROVED" ? { user, driver } : null;
}

/** Creates (listingId null) or updates one of the driver's own routes. Published immediately. */
export async function driverRouteAction(
  listingId: string | null,
  formData: FormData,
): Promise<ActionState> {
  const owner = await approvedDriver();
  if (!owner) return { status: "error", errors: {}, reason: "not-allowed" };
  const parsed = driverRouteSchema.safeParse(routeInput(formData));
  if (!parsed.success)
    return { status: "error", errors: fieldErrors(parsed.error), reason: "invalid" };

  try {
    const result = listingId
      ? await updateDriverListing(owner.driver.id, listingId, parsed.data)
      : await createDriverListing(owner.driver.id, owner.user.id, parsed.data);
    if (!result) return { status: "error", errors: {}, reason: "not-found" };
    refreshListings(result.id);
    return { status: "success", id: result.id };
  } catch (error) {
    if (error instanceof UnknownPlaceError) {
      return { status: "error", errors: { stops: "stops" }, reason: "invalid" };
    }
    throw error;
  }
}

export async function confirmDriverRouteAction(listingId: string) {
  const owner = await approvedDriver();
  if (!owner || !(await confirmDriverListing(owner.driver.id, listingId))) return;
  refreshListings(listingId);
}

export async function archiveDriverRouteAction(listingId: string) {
  const owner = await approvedDriver();
  if (!owner || !(await archiveDriverListing(owner.driver.id, listingId))) return;
  refreshListings(listingId);
}
