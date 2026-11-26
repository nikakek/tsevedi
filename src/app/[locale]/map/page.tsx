import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RoutesMap, type MapLine, type MapPlace } from "@/components/routes-map";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { placeName } from "@/i18n/format";
import { paths } from "@/lib/paths";
import { PAGE } from "@/lib/ui";
import { getApprovedListings, getPlaces } from "@/server/queries";

type Props = PageProps<"/[locale]/map">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return {
    title: dict.map.title,
    description: dict.map.intro,
    alternates: { canonical: paths.map(locale) },
  };
}

export default async function MapPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [dict, places, listings] = await Promise.all([
    getDictionary(locale),
    getPlaces(),
    getApprovedListings(),
  ]);

  const active = listings.filter((listing) => listing.freshness !== "expired");
  const routeCount = new Map<string, number>();
  for (const listing of active)
    for (const stop of listing.stops) routeCount.set(stop.id, (routeCount.get(stop.id) ?? 0) + 1);

  const mapPlaces: MapPlace[] = places
    .filter((place) => place.region !== "abroad" || routeCount.has(place.id))
    .map((place) => ({
      slug: place.slug,
      name: placeName(place, locale),
      lat: place.lat,
      lng: place.lng,
      href: paths.place(locale, place.slug),
      served: routeCount.has(place.id),
      routes: routeCount.get(place.id) ?? 0,
    }));
  const lines: MapLine[] = active.map((listing) =>
    listing.stops.map((stop) => [stop.lat, stop.lng]),
  );

  return (
    <div className={`${PAGE} py-8`}>
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{dict.map.title}</h1>
      <p className="text-muted mt-2 mb-6">{dict.map.intro}</p>
      <RoutesMap
        places={mapPlaces}
        lines={lines}
        openLabel={dict.map.open}
        label={dict.map.title}
      />
    </div>
  );
}
