import "server-only";
import type { ListingSubmission, ProblemReportInput, RideReportInput } from "@/lib/validation";
import { db } from "./db";

export class UnknownPlaceError extends Error {
  constructor(public slugs: string[]) {
    super(`Unknown places: ${slugs.join(", ")}`);
  }
}

/** Stores a submission as PENDING. Nothing becomes public until an admin approves it. */
export async function createListingSubmission(input: ListingSubmission) {
  const places = await db.place.findMany({
    where: { slug: { in: input.stops } },
    select: { id: true, slug: true },
  });
  const idBySlug = new Map(places.map((place) => [place.slug, place.id]));
  const unknown = input.stops.filter((slug) => !idBySlug.has(slug));
  if (unknown.length) throw new UnknownPlaceError(unknown);

  return db.listing.create({
    data: {
      driver: {
        create: {
          name: input.driverName,
          phone: input.phone,
          whatsapp: input.whatsapp,
          viber: input.viber,
          telegram: input.telegram,
          languages: input.languages,
          vehicleType: input.vehicleType,
          vehicleModel: input.vehicleModel,
          vehicleColor: input.vehicleColor,
          plate: input.plate?.toUpperCase(),
          seats: input.seats,
        },
      },
      stops: {
        create: input.stops.map((slug, position) => ({ placeId: idBySlug.get(slug)!, position })),
      },
      departureTime: input.departureTime.padStart(5, "0"),
      days: input.days,
      activeMonths: input.activeMonths,
      departurePoint: input.departurePoint,
      departureMapsUrl: input.departureMapsUrl,
      returnTime: input.returnTime?.padStart(5, "0"),
      returnPoint: input.returnPoint,
      pricePerSeat: input.pricePerSeat,
      priceWholeVehicle: input.priceWholeVehicle,
      largeLuggage: input.largeLuggage,
      callAhead: input.callAhead,
      notes: input.notes,
      submittedByDriver: input.submittedByDriver,
      submitterContact: input.submitterContact,
    },
    select: { id: true },
  });
}

async function assertApproved(listingId: string) {
  const listing = await db.listing.findFirst({
    where: { id: listingId, status: "APPROVED" },
    select: { id: true },
  });
  return !!listing;
}

export async function createRideReport(listingId: string, input: RideReportInput) {
  if (!(await assertApproved(listingId))) return null;
  return db.rideReport.create({
    data: {
      listingId,
      travelDate: new Date(`${input.travelDate}T00:00:00Z`),
      outcome: input.outcome,
      departedAt: input.departedAt,
      pricePaid: input.pricePaid,
      comment: input.comment,
    },
    select: { id: true },
  });
}

export async function createProblemReport(listingId: string, input: ProblemReportInput) {
  if (!(await assertApproved(listingId))) return null;
  return db.problemReport.create({
    data: { listingId, kind: input.kind, message: input.message },
    select: { id: true },
  });
}
