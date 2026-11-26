import type { MetadataRoute } from "next";
import { LOCALE_TAGS, LOCALES, type Locale } from "@/i18n/config";
import { paths, SITE_URL } from "@/lib/paths";
import { getPlaceRoutes, getPlaces, getRoutePairs } from "@/server/queries";

function entry(build: (locale: Locale) => string, priority: number): MetadataRoute.Sitemap {
  return LOCALES.map((locale) => ({
    url: `${SITE_URL}${build(locale)}`,
    changeFrequency: "weekly",
    priority,
    alternates: { languages: Object.fromEntries(LOCALES.map((l) => [LOCALE_TAGS[l], `${SITE_URL}${build(l)}`])) },
  }));
}

/** Every page in every language, with hreflang alternates. Only places and routes that have listings are included. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pairs, places] = await Promise.all([getRoutePairs(), getPlaces()]);
  const served = [];
  for (const place of places) {
    const { destinations, origins } = await getPlaceRoutes(place.id);
    if (destinations.length || origins.length) served.push(place);
  }

  return [
    ...entry(paths.home, 1),
    ...entry(paths.map, 0.6),
    ...entry(paths.add, 0.5),
    ...entry(paths.about, 0.3),
    ...pairs.flatMap((pair) => entry((l) => paths.route(l, pair.from.slug, pair.to.slug), 0.9)),
    ...served.flatMap((place) => entry((l) => paths.place(l, place.slug), 0.7)),
  ];
}
