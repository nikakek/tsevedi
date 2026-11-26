import "server-only";
import { db } from "./db";
import { getApprovedListings, getListing, type ListingView } from "./queries";

export type SavedIds = { drivers: string[]; listings: string[] };

export async function getSavedIds(userId: string): Promise<SavedIds> {
  const [drivers, listings] = await Promise.all([
    db.savedDriver.findMany({ where: { userId }, select: { driverId: true } }),
    db.savedListing.findMany({ where: { userId }, select: { listingId: true } }),
  ]);
  return { drivers: drivers.map((d) => d.driverId), listings: listings.map((l) => l.listingId) };
}

export async function setSaved(
  userId: string,
  type: "driver" | "listing",
  id: string,
  saved: boolean,
) {
  if (type === "driver") {
    const key = { userId_driverId: { userId, driverId: id } };
    if (saved)
      await db.savedDriver.upsert({ where: key, create: { userId, driverId: id }, update: {} });
    else await db.savedDriver.deleteMany({ where: { userId, driverId: id } });
  } else {
    const key = { userId_listingId: { userId, listingId: id } };
    if (saved)
      await db.savedListing.upsert({ where: key, create: { userId, listingId: id }, update: {} });
    else await db.savedListing.deleteMany({ where: { userId, listingId: id } });
  }
}

export type SavedDriverView = {
  id: string;
  name: string;
  /** The driver's currently published trips; empty if none are listed any more. */
  listings: ListingView[];
};

/** Everything the profile page shows. Saved items use the same cached listing data as public pages. */
export async function getAccountOverview(userId: string) {
  const [savedDrivers, savedListings, submissions, driver, approved] = await Promise.all([
    db.savedDriver.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { driver: { select: { id: true, name: true } } },
    }),
    db.savedListing.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { listingId: true },
    }),
    db.listing.findMany({
      where: { submittedById: userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        status: true,
        departureTime: true,
        createdAt: true,
        stops: {
          orderBy: { position: "asc" },
          select: { place: { select: { nameKa: true, nameEn: true, nameRu: true } } },
        },
      },
    }),
    db.driver.findUnique({ where: { userId }, select: { id: true, status: true, phone: true } }),
    getApprovedListings(),
  ]);

  const drivers: SavedDriverView[] = savedDrivers.map(({ driver: d }) => ({
    id: d.id,
    name: d.name,
    listings: approved.filter((listing) => listing.driver.id === d.id),
  }));
  const trips = await Promise.all(savedListings.map(({ listingId }) => getListing(listingId)));

  return {
    drivers,
    trips: savedListings.map(({ listingId }, i) => ({ id: listingId, listing: trips[i] })),
    submissions,
    driver,
  };
}
