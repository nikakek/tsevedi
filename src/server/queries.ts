import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { daysSince, freshness, lastVerifiedAt, type Freshness } from "@/lib/freshness";
import { matchListing, minutesOfDay, type RouteMatch } from "@/lib/route-matching";
import { runsOn } from "@/lib/schedule";
import { db } from "./db";
import type { Language, VehicleType } from "@/generated/prisma/enums";

export const TAGS = {
  places: "places",
  listings: "listings",
  listing: (id: string) => `listing:${id}`,
} as const;

export type PlaceSummary = {
  id: string;
  slug: string;
  nameKa: string;
  nameEn: string;
  nameRu: string;
  aliases: string[];
  region: string;
  kind: string;
  lat: number;
  lng: number;
};

export type ListingView = {
  id: string;
  departureTime: string;
  returnTime: string | null;
  days: number[];
  activeMonths: number[];
  departurePoint: string;
  departureMapsUrl: string | null;
  returnPoint: string | null;
  pricePerSeat: number | null;
  priceWholeVehicle: number | null;
  largeLuggage: boolean | null;
  callAhead: boolean;
  notes: string | null;
  verifiedDaysAgo: number | null;
  freshness: Freshness;
  rideReportCount: number;
  driver: {
    id: string;
    name: string;
    phone: string;
    whatsapp: boolean;
    viber: boolean;
    telegram: boolean;
    languages: Language[];
    vehicleType: VehicleType;
    vehicleModel: string | null;
    vehicleColor: string | null;
    plate: string | null;
    seats: number | null;
  };
  stops: PlaceSummary[];
};

export type RouteResult = { listing: ListingView; match: RouteMatch; runsOnDate: boolean | null };

const placeSelect = {
  id: true,
  slug: true,
  nameKa: true,
  nameEn: true,
  nameRu: true,
  aliases: true,
  region: true,
  kind: true,
  lat: true,
  lng: true,
} as const;

const listingInclude = {
  driver: true,
  stops: { orderBy: { position: "asc" }, include: { place: { select: placeSelect } } },
  rideReports: {
    where: { hidden: false, outcome: "WORKED" },
    orderBy: { travelDate: "desc" },
    take: 1,
    select: { travelDate: true },
  },
  _count: { select: { rideReports: { where: { hidden: false } } } },
} as const;

type ListingRow = Awaited<ReturnType<typeof fetchListingRows>>[number];

function fetchListingRows(where: { status?: "APPROVED"; id?: string }) {
  return db.listing.findMany({ where, include: listingInclude });
}

function toView(row: ListingRow, now: Date): ListingView {
  const verifiedAt = lastVerifiedAt(row.lastConfirmedAt, row.rideReports[0]?.travelDate ?? null);
  const { driver } = row;
  return {
    id: row.id,
    departureTime: row.departureTime,
    returnTime: row.returnTime,
    days: row.days,
    activeMonths: row.activeMonths,
    departurePoint: row.departurePoint,
    departureMapsUrl: row.departureMapsUrl,
    returnPoint: row.returnPoint,
    pricePerSeat: row.pricePerSeat,
    priceWholeVehicle: row.priceWholeVehicle,
    largeLuggage: row.largeLuggage,
    callAhead: row.callAhead,
    notes: row.notes,
    verifiedDaysAgo: verifiedAt ? daysSince(verifiedAt, now) : null,
    freshness: freshness(verifiedAt, now),
    rideReportCount: row._count.rideReports,
    driver: {
      id: driver.id,
      name: driver.name,
      phone: driver.phone,
      whatsapp: driver.whatsapp,
      viber: driver.viber,
      telegram: driver.telegram,
      languages: driver.languages,
      vehicleType: driver.vehicleType,
      vehicleModel: driver.vehicleModel,
      vehicleColor: driver.vehicleColor,
      plate: driver.plate,
      seats: driver.seats,
    },
    stops: row.stops.map((stop) => stop.place),
  };
}

export async function getPlaces(): Promise<PlaceSummary[]> {
  "use cache";
  cacheLife("days");
  cacheTag(TAGS.places);
  return db.place.findMany({ select: placeSelect, orderBy: { nameEn: "asc" } });
}

export async function getPlaceBySlug(slug: string): Promise<PlaceSummary | null> {
  const places = await getPlaces();
  return places.find((place) => place.slug === slug) ?? null;
}

/**
 * Every approved listing, ready for display. The whole set is small (hundreds of rows), so route
 * matching happens in memory on this cached list instead of in SQL.
 */
export async function getApprovedListings(): Promise<ListingView[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.listings);
  const now = new Date();
  const rows = await fetchListingRows({ status: "APPROVED" });
  return rows.map((row) => toView(row, now));
}

export async function searchRoutes(
  fromId: string,
  toId: string,
  date: string | null,
): Promise<{ results: RouteResult[]; reverseCount: number }> {
  const listings = (await getApprovedListings()).filter((l) => l.freshness !== "expired");
  const results: RouteResult[] = [];
  let reverseCount = 0;

  for (const listing of listings) {
    const stopRefs = {
      stops: listing.stops.map((s) => ({ placeId: s.id })),
      returnTime: listing.returnTime,
    };
    const match = matchListing(stopRefs, fromId, toId);
    if (match) {
      results.push({ listing, match, runsOnDate: date ? runsOn(listing, date) : null });
    } else if (matchListing(stopRefs, toId, fromId)) {
      reverseCount++;
    }
  }

  const departure = (r: RouteResult) =>
    minutesOfDay(r.match.direction === "outbound" ? r.listing.departureTime : r.listing.returnTime);
  results.sort(
    (a, b) => Number(b.runsOnDate ?? 0) - Number(a.runsOnDate ?? 0) || departure(a) - departure(b),
  );
  return { results, reverseCount };
}

export type ListingDetail = ListingView & {
  rideReports: Array<{
    id: string;
    travelDate: string;
    outcome: "WORKED" | "DIFFERENT" | "DID_NOT_RUN";
    departedAt: string | null;
    pricePaid: number | null;
    comment: string | null;
  }>;
};

/** A single approved listing, including stale ones (direct links keep working). */
export async function getListing(id: string): Promise<ListingDetail | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.listings, TAGS.listing(id));
  const row = await db.listing.findFirst({
    where: { id, status: "APPROVED" },
    include: listingInclude,
  });
  if (!row) return null;
  const reports = await db.rideReport.findMany({
    where: { listingId: id, hidden: false },
    orderBy: { travelDate: "desc" },
    take: 20,
  });
  return {
    ...toView(row, new Date()),
    rideReports: reports.map((report) => ({
      id: report.id,
      travelDate: report.travelDate.toISOString().slice(0, 10),
      outcome: report.outcome,
      departedAt: report.departedAt,
      pricePaid: report.pricePaid,
      comment: report.comment,
    })),
  };
}

export type RoutePair = {
  from: PlaceSummary;
  to: PlaceSummary;
  count: number;
  minPrice: number | null;
};

/** Distinct origin → destination pairs, most listings first. Used on the homepage and in the sitemap. */
export async function getRoutePairs(): Promise<RoutePair[]> {
  const listings = (await getApprovedListings()).filter((l) => l.freshness !== "expired");
  const pairs = new Map<string, RoutePair>();
  const add = (from: PlaceSummary, to: PlaceSummary, price: number | null) => {
    const key = `${from.slug}>${to.slug}`;
    const pair = pairs.get(key) ?? { from, to, count: 0, minPrice: null };
    pair.count++;
    if (price !== null)
      pair.minPrice = pair.minPrice === null ? price : Math.min(pair.minPrice, price);
    pairs.set(key, pair);
  };
  for (const listing of listings) {
    const first = listing.stops[0];
    const last = listing.stops.at(-1);
    if (!first || !last) continue;
    add(first, last, listing.pricePerSeat);
    if (listing.returnTime) add(last, first, listing.pricePerSeat);
  }
  return [...pairs.values()].sort(
    (a, b) => b.count - a.count || a.from.nameEn.localeCompare(b.from.nameEn),
  );
}

/** Listings that stop at a place, split by whether the place is where you board or get off. */
export async function getPlaceRoutes(placeId: string) {
  const listings = (await getApprovedListings()).filter((l) => l.freshness !== "expired");
  const destinations = new Map<string, PlaceSummary>();
  const origins = new Map<string, PlaceSummary>();
  for (const listing of listings) {
    const index = listing.stops.findIndex((stop) => stop.id === placeId);
    if (index === -1) continue;
    listing.stops.slice(index + 1).forEach((stop) => destinations.set(stop.id, stop));
    listing.stops.slice(0, index).forEach((stop) => origins.set(stop.id, stop));
    if (listing.returnTime) {
      listing.stops.slice(0, index).forEach((stop) => destinations.set(stop.id, stop));
      listing.stops.slice(index + 1).forEach((stop) => origins.set(stop.id, stop));
    }
  }
  return { destinations: [...destinations.values()], origins: [...origins.values()] };
}

export async function getStats() {
  const [listings, places] = await Promise.all([getApprovedListings(), getPlaces()]);
  const servedPlaces = new Set(listings.flatMap((listing) => listing.stops.map((stop) => stop.id)));
  return { routes: listings.length, places: servedPlaces.size, totalPlaces: places.length };
}
