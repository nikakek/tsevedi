import "server-only";
import type { ListingStatus } from "@/generated/prisma/enums";
import { daysSince, freshness, lastVerifiedAt } from "@/lib/freshness";
import type { ListingSubmission } from "@/lib/validation";
import { db } from "./db";
import { UnknownPlaceError } from "./mutations";

const adminInclude = {
  driver: true,
  submittedBy: { select: { id: true, name: true, email: true, banned: true } },
  stops: {
    orderBy: { position: "asc" },
    include: { place: { select: { slug: true, nameEn: true, nameKa: true } } },
  },
  rideReports: {
    where: { hidden: false, outcome: "WORKED" },
    orderBy: { travelDate: "desc" },
    take: 1,
    select: { travelDate: true },
  },
  _count: { select: { problemReports: { where: { resolved: false } } } },
} as const;

export type AdminListing = Awaited<ReturnType<typeof listListings>>[number];

export async function listListings(status: ListingStatus) {
  const rows = await db.listing.findMany({
    where: { status },
    include: adminInclude,
    orderBy: status === "PENDING" ? { createdAt: "asc" } : { updatedAt: "desc" },
    take: 200,
  });
  const now = new Date();
  const withFreshness = rows.map((row) => {
    const verifiedAt = lastVerifiedAt(row.lastConfirmedAt, row.rideReports[0]?.travelDate ?? null);
    return {
      ...row,
      verifiedDaysAgo: verifiedAt ? daysSince(verifiedAt, now) : null,
      freshness: freshness(verifiedAt, now),
    };
  });
  // For approved listings, the ones most in need of a phone call come first.
  if (status === "APPROVED")
    withFreshness.sort((a, b) => (b.verifiedDaysAgo ?? Infinity) - (a.verifiedDaysAgo ?? Infinity));
  return withFreshness;
}

export async function getCounts() {
  const [pending, approved, problems, drivers] = await Promise.all([
    db.listing.count({ where: { status: "PENDING" } }),
    db.listing.count({ where: { status: "APPROVED" } }),
    db.problemReport.count({ where: { resolved: false } }),
    db.driver.count({ where: { status: "PENDING" } }),
  ]);
  return { pending, approved, problems, drivers };
}

/** Phones of pending submissions that already belong to a driver with approved listings. */
export async function knownPhones(phones: string[]) {
  if (phones.length === 0) return new Set<string>();
  const rows = await db.driver.findMany({
    where: { phone: { in: phones }, listings: { some: { status: "APPROVED" } } },
    select: { phone: true },
  });
  return new Set(rows.map((row) => row.phone));
}

export function listOpenProblems() {
  return db.problemReport.findMany({
    where: { resolved: false },
    orderBy: { createdAt: "desc" },
    include: {
      listing: {
        select: {
          id: true,
          departureTime: true,
          driver: { select: { name: true, phone: true } },
          stops: { orderBy: { position: "asc" }, select: { place: { select: { nameEn: true } } } },
        },
      },
    },
    take: 200,
  });
}

export function listRecentRideReports() {
  return db.rideReport.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      listing: {
        select: {
          id: true,
          stops: { orderBy: { position: "asc" }, select: { place: { select: { nameEn: true } } } },
        },
      },
    },
    take: 100,
  });
}

export function getListingForEdit(id: string) {
  return db.listing.findUnique({ where: { id }, include: adminInclude });
}

export async function setListingStatus(id: string, status: ListingStatus) {
  const now = new Date();
  return db.listing.update({
    where: { id },
    data: {
      status,
      // Approving means the admin has just checked the details with the driver.
      ...(status === "APPROVED" ? { approvedAt: now, lastConfirmedAt: now } : {}),
    },
    select: { id: true },
  });
}

export function confirmListing(id: string) {
  return db.listing.update({
    where: { id },
    data: { lastConfirmedAt: new Date() },
    select: { id: true },
  });
}

export function resolveProblem(id: string) {
  return db.problemReport.update({
    where: { id },
    data: { resolved: true },
    select: { listingId: true },
  });
}

export function setRideReportHidden(id: string, hidden: boolean) {
  return db.rideReport.update({ where: { id }, data: { hidden }, select: { listingId: true } });
}

export async function updateListing(id: string, input: ListingSubmission & { adminNote?: string }) {
  const places = await db.place.findMany({
    where: { slug: { in: input.stops } },
    select: { id: true, slug: true },
  });
  const idBySlug = new Map(places.map((place) => [place.slug, place.id]));
  const unknown = input.stops.filter((slug) => !idBySlug.has(slug));
  if (unknown.length) throw new UnknownPlaceError(unknown);

  const listing = await db.listing.findUniqueOrThrow({ where: { id }, select: { driverId: true } });
  await db.$transaction([
    db.driver.update({
      where: { id: listing.driverId },
      data: {
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
      },
    }),
    db.routeStop.deleteMany({ where: { listingId: id } }),
    db.listing.update({
      where: { id },
      data: {
        stops: {
          create: input.stops.map((slug, position) => ({ placeId: idBySlug.get(slug)!, position })),
        },
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
        adminNote: input.adminNote ?? null,
      },
    }),
  ]);
}

// --- Driver registrations ---------------------------------------------------------------------

/** Drivers who registered with their own account, newest first, with listings that would be merged. */
export async function listDriverRegistrations(status: "PENDING" | "APPROVED" | "REJECTED") {
  const drivers = await db.driver.findMany({
    where: { status },
    orderBy: { createdAt: status === "PENDING" ? "asc" : "desc" },
    take: 200,
    include: {
      user: { select: { name: true, email: true, banned: true } },
      _count: { select: { listings: true } },
    },
  });
  // Listings someone else added for the same phone number get linked to the account on approval.
  const matches = await db.driver.findMany({
    where: { status: "UNCLAIMED", phone: { in: drivers.map((d) => d.phone) } },
    select: { phone: true, _count: { select: { listings: true } } },
  });
  return drivers.map((driver) => ({
    ...driver,
    mergeableListings: matches
      .filter((m) => m.phone === driver.phone)
      .reduce((sum, m) => sum + m._count.listings, 0),
  }));
}

/**
 * Approves a driver account. Unclaimed driver records with the same phone (added by other people)
 * are merged into it, so the driver can manage those listings too.
 */
export async function approveDriver(driverId: string) {
  const driver = await db.driver.findUniqueOrThrow({
    where: { id: driverId },
    select: { phone: true },
  });
  const duplicates = await db.driver.findMany({
    where: { status: "UNCLAIMED", phone: driver.phone },
    select: { id: true },
  });
  const ids = duplicates.map((d) => d.id);
  await db.$transaction([
    db.listing.updateMany({ where: { driverId: { in: ids } }, data: { driverId } }),
    db.driver.deleteMany({ where: { id: { in: ids } } }),
    db.driver.update({
      where: { id: driverId },
      data: { status: "APPROVED", approvedAt: new Date() },
    }),
  ]);
}

export function rejectDriver(driverId: string) {
  return db.driver.update({ where: { id: driverId }, data: { status: "REJECTED" } });
}

// --- Users and bans ---------------------------------------------------------------------------

export function listUsers(query: string) {
  const q = query.trim();
  return db.user.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      banned: true,
      banReason: true,
      driver: { select: { status: true } },
      _count: { select: { submittedListings: true, rideReports: true, problemReports: true } },
    },
  });
}

/**
 * Bans a user: signs them out everywhere, rejects their pending submissions and, if they are a
 * registered driver, unpublishes their routes.
 */
export async function banUser(userId: string, reason: string | null) {
  const driver = await db.driver.findUnique({ where: { userId }, select: { id: true } });
  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: { banned: true, banReason: reason, bannedAt: new Date() },
    }),
    db.session.deleteMany({ where: { userId } }),
    db.listing.updateMany({
      where: { submittedById: userId, status: "PENDING" },
      data: { status: "REJECTED" },
    }),
    ...(driver
      ? [
          db.driver.update({ where: { id: driver.id }, data: { status: "REJECTED" } }),
          db.listing.updateMany({
            where: { driverId: driver.id, status: "APPROVED" },
            data: { status: "ARCHIVED" },
          }),
        ]
      : []),
  ]);
}

export function unbanUser(userId: string) {
  return db.user.update({
    where: { id: userId },
    data: { banned: false, banReason: null, bannedAt: null },
  });
}
