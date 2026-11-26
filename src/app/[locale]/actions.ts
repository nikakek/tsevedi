"use server";

import { updateTag } from "next/cache";
import { headers } from "next/headers";
import {
  fieldErrors,
  listingSubmissionSchema,
  problemReportSchema,
  rideReportSchema,
  type ValidationKey,
} from "@/lib/validation";
import { createListingSubmission, createProblemReport, createRideReport, UnknownPlaceError } from "@/server/mutations";
import { TAGS } from "@/server/queries";
import { clientIp, rateLimit } from "@/server/rate-limit";

export type ActionState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; errors: Record<string, ValidationKey>; reason?: "invalid" | "rate-limited" | "not-found" };

const HOUR = 60 * 60 * 1000;

async function allowed(action: string, limit: number) {
  return rateLimit(`${action}:${clientIp(await headers())}`, limit, HOUR);
}

const checked = (formData: FormData, name: string) => formData.get(name) === "on";
const value = (formData: FormData, name: string) => {
  const v = formData.get(name);
  return typeof v === "string" ? v : undefined;
};

export async function submitListingAction(formData: FormData): Promise<ActionState> {
  // Honeypot: real people never see or fill this field.
  if (value(formData, "website")) return { status: "success" };
  if (!(await allowed("submit", 10))) return { status: "error", errors: {}, reason: "rate-limited" };

  const parsed = listingSubmissionSchema.safeParse({
    submittedByDriver: value(formData, "who") === "driver",
    driverName: value(formData, "driverName"),
    phone: value(formData, "phone"),
    whatsapp: checked(formData, "whatsapp"),
    viber: checked(formData, "viber"),
    telegram: checked(formData, "telegram"),
    languages: formData.getAll("languages"),
    vehicleType: value(formData, "vehicleType"),
    vehicleModel: value(formData, "vehicleModel"),
    vehicleColor: value(formData, "vehicleColor"),
    plate: value(formData, "plate"),
    seats: value(formData, "seats"),
    stops: formData.getAll("stops").filter((s) => typeof s === "string" && s !== ""),
    departureTime: value(formData, "departureTime"),
    days: formData.getAll("days"),
    activeMonths: formData.getAll("activeMonths"),
    departurePoint: value(formData, "departurePoint"),
    departureMapsUrl: value(formData, "departureMapsUrl"),
    returnTime: checked(formData, "returns") ? value(formData, "returnTime") : undefined,
    returnPoint: checked(formData, "returns") ? value(formData, "returnPoint") : undefined,
    pricePerSeat: value(formData, "pricePerSeat"),
    priceWholeVehicle: value(formData, "priceWholeVehicle"),
    largeLuggage: checked(formData, "largeLuggage") || undefined,
    callAhead: checked(formData, "callAhead"),
    notes: value(formData, "notes"),
    submitterContact: value(formData, "submitterContact"),
  });
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error), reason: "invalid" };

  try {
    await createListingSubmission(parsed.data);
  } catch (error) {
    if (error instanceof UnknownPlaceError) return { status: "error", errors: { stops: "stops" }, reason: "invalid" };
    throw error;
  }
  return { status: "success" };
}

export async function rideReportAction(listingId: string, formData: FormData): Promise<ActionState> {
  if (value(formData, "website")) return { status: "success" };
  if (!(await allowed("ride-report", 20))) return { status: "error", errors: {}, reason: "rate-limited" };

  const parsed = rideReportSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error), reason: "invalid" };

  const report = await createRideReport(listingId, parsed.data);
  if (!report) return { status: "error", errors: {}, reason: "not-found" };
  updateTag(TAGS.listing(listingId));
  updateTag(TAGS.listings);
  return { status: "success" };
}

export async function problemReportAction(listingId: string, formData: FormData): Promise<ActionState> {
  if (value(formData, "website")) return { status: "success" };
  if (!(await allowed("problem-report", 20))) return { status: "error", errors: {}, reason: "rate-limited" };

  const parsed = problemReportSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error), reason: "invalid" };

  const report = await createProblemReport(listingId, parsed.data);
  if (!report) return { status: "error", errors: {}, reason: "not-found" };
  return { status: "success" };
}
