import "server-only";
import type {
  DriverRegistration,
  DriverRoute,
  ListingSubmission,
  ProblemReportInput,
  RideReportInput,
} from "@/lib/validation";
import { db } from "./db";

export class UnknownPlaceError extends Error {
  constructor(public slugs: string[]) {
    super(`Unknown places: ${slugs.join(", ")}`);
  }
}

/** Maps place slugs to ids, throwing if any slug is unknown. */
export async function resolveStops(slugs: string[]) {
  const places = await db.place.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, slug: true },
  });
  const idBySlug = new Map(places.map((place) => [place.slug, place.id]));
  const unknown = slugs.filter((slug) => !idBySlug.has(slug));
  if (unknown.length) throw new UnknownPlaceError(unknown);
  return slugs.map((slug, position) => ({ placeId: idBySlug.get(slug)!, position }));
}

/** Listing columns shared by every way a route is created or edited. */
export function routeColumns(input: DriverRoute) {
  return {
    departureTime: input.departureTime.padStart(5, "0"),
    days: input.days,
    activeMonths: input.activeMonths,
    departurePoint: input.departurePoint,
    departureMapsUrl: input.departureMapsUrl ?? null,
    returnTime: input.returnTime?.padStart(5, "0") ?? null,
    returnPoint: input.returnPoint ?? null,
    pricePerSeat: input.pricePerSeat ?? null,
    priceWholeVehicle: input.priceWholeVehicle ?? null,
    largeLuggage: input.largeLuggage ?? null,
    callAhead: input.callAhead,
    notes: input.notes ?? null,
  };
}

/** Driver columns shared by public submissions, driver registration and admin edits. */
export function driverColumns(input: DriverRegistration) {
  return {
    name: input.driverName,
    phone: input.phone,
    whatsapp: input.whatsapp,
    viber: input.viber,
    telegram: input.telegram,
    languages: input.languages,
    vehicleType: input.vehicleType,
    vehicleModel: input.vehicleModel ?? null,
    vehicleColor: input.vehicleColor ?? null,
    plate: input.plate?.toUpperCase() ?? null,
    seats: input.seats ?? null,
  };
}

/** Stores a submission as PENDING. Nothing becomes public until an admin approves it. */
export async function createListingSubmission(input: ListingSubmission, submittedById: string) {
  const stops = await resolveStops(input.stops);
  return db.listing.create({
    data: {
      driver: { create: driverColumns(input) },
      stops: { create: stops },
      ...routeColumns(input),
      submittedByDriver: input.submittedByDriver,
      submitterContact: input.submitterContact,
      submittedBy: { connect: { id: submittedById } },
    },
    select: { id: true },
  });
}

async function isApproved(listingId: string) {
  const listing = await db.listing.findFirst({
    where: { id: listingId, status: "APPROVED" },
    select: { id: true },
  });
  return !!listing;
}

export async function createRideReport(listingId: string, input: RideReportInput, userId: string) {
  if (!(await isApproved(listingId))) return null;
  return db.rideReport.create({
    data: {
      listingId,
      userId,
      travelDate: new Date(`${input.travelDate}T00:00:00Z`),
      outcome: input.outcome,
      departedAt: input.departedAt,
      pricePaid: input.pricePaid,
      comment: input.comment,
    },
    select: { id: true },
  });
}

export async function createProblemReport(
  listingId: string,
  input: ProblemReportInput,
  userId: string,
) {
  if (!(await isApproved(listingId))) return null;
  return db.problemReport.create({
    data: { listingId, userId, kind: input.kind, message: input.message },
    select: { id: true },
  });
}
