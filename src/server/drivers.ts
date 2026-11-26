import "server-only";
import type { DriverRegistration, DriverRoute } from "@/lib/validation";
import { db } from "./db";
import { driverColumns, resolveStops, routeColumns } from "./mutations";

/** The driver profile belonging to a user account, if they registered as a driver. */
export function getDriverForUser(userId: string) {
  return db.driver.findUnique({
    where: { userId },
    select: {
      id: true,
      name: true,
      phone: true,
      status: true,
      vehicleType: true,
      vehicleModel: true,
    },
  });
}

/** Creates a PENDING driver profile. The admin approves it after a phone call. */
export async function registerDriver(userId: string, input: DriverRegistration) {
  const existing = await db.driver.findUnique({ where: { userId }, select: { id: true } });
  if (existing) return existing;
  return db.driver.create({
    data: { ...driverColumns(input), user: { connect: { id: userId } }, status: "PENDING" },
    select: { id: true },
  });
}

/** All of a driver's routes, newest first, for their own dashboard (any status except archived). */
export function getDriverListings(driverId: string) {
  return db.listing.findMany({
    where: { driverId, status: { not: "ARCHIVED" } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      departureTime: true,
      returnTime: true,
      days: true,
      pricePerSeat: true,
      lastConfirmedAt: true,
      stops: {
        orderBy: { position: "asc" },
        select: { place: { select: { slug: true, nameKa: true, nameEn: true, nameRu: true } } },
      },
    },
  });
}

/** A route owned by the driver, with stops as slugs, for the edit form. */
export async function getDriverListingForEdit(driverId: string, listingId: string) {
  const listing = await db.listing.findFirst({
    where: { id: listingId, driverId, status: { not: "ARCHIVED" } },
    include: {
      stops: { orderBy: { position: "asc" }, select: { place: { select: { slug: true } } } },
    },
  });
  return listing ? { ...listing, stopSlugs: listing.stops.map((s) => s.place.slug) } : null;
}

/** Approved drivers publish directly: the route is live and counts as confirmed today. */
export async function createDriverListing(driverId: string, userId: string, input: DriverRoute) {
  const stops = await resolveStops(input.stops);
  const now = new Date();
  return db.listing.create({
    data: {
      driver: { connect: { id: driverId } },
      stops: { create: stops },
      ...routeColumns(input),
      status: "APPROVED",
      submittedByDriver: true,
      submittedBy: { connect: { id: userId } },
      approvedAt: now,
      lastConfirmedAt: now,
    },
    select: { id: true },
  });
}

export async function updateDriverListing(driverId: string, listingId: string, input: DriverRoute) {
  const owned = await db.listing.findFirst({
    where: { id: listingId, driverId },
    select: { id: true },
  });
  if (!owned) return null;
  const stops = await resolveStops(input.stops);
  await db.$transaction([
    db.routeStop.deleteMany({ where: { listingId } }),
    db.listing.update({
      where: { id: listingId },
      data: { ...routeColumns(input), stops: { create: stops }, lastConfirmedAt: new Date() },
    }),
  ]);
  return owned;
}

export async function confirmDriverListing(driverId: string, listingId: string) {
  const { count } = await db.listing.updateMany({
    where: { id: listingId, driverId },
    data: { lastConfirmedAt: new Date() },
  });
  return count > 0;
}

export async function archiveDriverListing(driverId: string, listingId: string) {
  const { count } = await db.listing.updateMany({
    where: { id: listingId, driverId },
    data: { status: "ARCHIVED" },
  });
  return count > 0;
}
