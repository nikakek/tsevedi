"use server";

import { updateTag } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { fieldErrors, listingSubmissionSchema, type ValidationKey } from "@/lib/validation";
import {
  approveDriver,
  banUser,
  rejectDriver,
  unbanUser,
  confirmListing,
  resolveProblem,
  setListingStatus,
  setRideReportHidden,
  updateListing,
} from "@/server/admin";
import { ADMIN_COOKIE, checkPassword, createSessionToken, requireAdmin } from "@/server/admin-auth";
import { UnknownPlaceError } from "@/server/mutations";
import { TAGS } from "@/server/queries";
import { clientIp, isLimited, rateLimit } from "@/server/rate-limit";

function refresh(listingId: string) {
  updateTag(TAGS.listings);
  updateTag(TAGS.listing(listingId));
}

export async function loginAction(_: string | null, formData: FormData): Promise<string | null> {
  // Only failed attempts count towards the limit.
  const key = `admin-login:${clientIp(await headers())}`;
  if (isLimited(key, 10)) return "Too many attempts. Try again in 15 minutes.";
  if (!checkPassword(String(formData.get("password") ?? ""))) {
    rateLimit(key, 10, 15 * 60 * 1000);
    return "Wrong password.";
  }

  const { token, expires } = createSessionToken();
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires,
  });
  redirect("/admin");
}

export async function logoutAction() {
  (await cookies()).delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

export async function approveAction(id: string) {
  await requireAdmin();
  await setListingStatus(id, "APPROVED");
  refresh(id);
}

export async function rejectAction(id: string) {
  await requireAdmin();
  await setListingStatus(id, "REJECTED");
  refresh(id);
}

export async function archiveAction(id: string) {
  await requireAdmin();
  await setListingStatus(id, "ARCHIVED");
  refresh(id);
}

export async function restoreAction(id: string) {
  await requireAdmin();
  await setListingStatus(id, "PENDING");
  refresh(id);
}

export async function confirmAction(id: string) {
  await requireAdmin();
  await confirmListing(id);
  refresh(id);
}

export async function resolveProblemAction(id: string) {
  await requireAdmin();
  const { listingId } = await resolveProblem(id);
  refresh(listingId);
}

export async function toggleRideReportAction(id: string, hidden: boolean) {
  await requireAdmin();
  const { listingId } = await setRideReportHidden(id, hidden);
  refresh(listingId);
}

export type EditState = { ok: boolean; errors: Record<string, ValidationKey | string> } | null;

export async function updateListingAction(
  id: string,
  _: EditState,
  formData: FormData,
): Promise<EditState> {
  await requireAdmin();
  const text = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" ? value : undefined;
  };
  const parsed = listingSubmissionSchema.safeParse({
    driverName: text("driverName"),
    phone: text("phone"),
    whatsapp: formData.get("whatsapp") === "on",
    viber: formData.get("viber") === "on",
    telegram: formData.get("telegram") === "on",
    languages: formData.getAll("languages"),
    vehicleType: text("vehicleType"),
    vehicleModel: text("vehicleModel"),
    vehicleColor: text("vehicleColor"),
    plate: text("plate"),
    seats: text("seats"),
    stops: (text("stops") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    departureTime: text("departureTime"),
    days: (text("days") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    activeMonths: (text("activeMonths") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    departurePoint: text("departurePoint"),
    departureMapsUrl: text("departureMapsUrl"),
    returnTime: text("returnTime"),
    returnPoint: text("returnPoint"),
    pricePerSeat: text("pricePerSeat"),
    priceWholeVehicle: text("priceWholeVehicle"),
    largeLuggage:
      text("largeLuggage") === "yes" ? true : text("largeLuggage") === "no" ? false : undefined,
    callAhead: formData.get("callAhead") === "on",
    notes: text("notes"),
  });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  try {
    await updateListing(id, { ...parsed.data, adminNote: text("adminNote")?.trim() || undefined });
  } catch (error) {
    if (error instanceof UnknownPlaceError)
      return { ok: false, errors: { stops: `Unknown: ${error.slugs.join(", ")}` } };
    throw error;
  }
  refresh(id);
  return { ok: true, errors: {} };
}

export async function approveDriverAction(driverId: string) {
  await requireAdmin();
  await approveDriver(driverId);
  updateTag(TAGS.listings);
}

export async function rejectDriverAction(driverId: string) {
  await requireAdmin();
  await rejectDriver(driverId);
}

export async function banUserAction(userId: string, formData: FormData) {
  await requireAdmin();
  const reason =
    String(formData.get("reason") ?? "")
      .trim()
      .slice(0, 300) || null;
  await banUser(userId, reason);
  updateTag(TAGS.listings);
}

export async function unbanUserAction(userId: string) {
  await requireAdmin();
  await unbanUser(userId);
}
