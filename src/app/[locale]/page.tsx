import { ArrowRight, Check, ChevronRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SearchForm } from "@/components/search-form";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary, type Dictionary } from "@/i18n/dictionaries";
import { placeName, t } from "@/i18n/format";
import { toComboPlaces } from "@/lib/combo-places";
import { paths } from "@/lib/paths";
import {
  getApprovedListings,
  getPlaces,
  type ListingView,
  type PlaceSummary,
} from "@/server/queries";

/** Shown as starting points before any routes exist. */
const STARTER_PLACES = [
  "tbilisi",
  "kutaisi",
  "batumi",
  "mestia",
  "stepantsminda",
  "ambrolauri",
  "telavi",
  "borjomi",
];

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [dict, places, allListings] = await Promise.all([
    getDictionary(locale),
    getPlaces(),
    getApprovedListings(),
  ]);
  const listings = allListings.filter((listing) => listing.freshness !== "expired");

  const counts = new Map<string, number>();
  for (const listing of listings)
    for (const stop of listing.stops) counts.set(stop.id, (counts.get(stop.id) ?? 0) + 1);
  const popular =
    counts.size > 0
      ? places
          .filter((place) => counts.has(place.id))
          .sort((a, b) => counts.get(b.id)! - counts.get(a.id)!)
          .slice(0, 10)
      : STARTER_PLACES.map((slug) => places.find((place) => place.slug === slug)).filter(
          (p): p is PlaceSummary => !!p,
        );
  const recent = listings
    .filter((listing) => listing.verifiedDaysAgo !== null)
    .sort((a, b) => a.verifiedDaysAgo! - b.verifiedDaysAgo!)
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-[75rem] px-4 md:px-10">
      <section className="grid gap-10 pt-10 md:pt-14 lg:grid-cols-[minmax(0,1fr)_29.5rem] lg:gap-12">
        <div>
          <h1 className="text-[2.75rem] leading-[1.02] font-semibold tracking-[-0.035em] text-balance md:text-[3.5rem] lg:text-[clamp(2.75rem,4.4vw,4rem)] [&:lang(ka)]:tracking-normal">
            {dict.home.heroTitle}
          </h1>
          <p className="text-muted mt-5 max-w-xl text-lg md:text-xl">{dict.home.heroSubtitle}</p>
          <div className="mt-8">
            <SearchForm locale={locale} dict={dict.search} places={toComboPlaces(places)} />
          </div>
          <p className="text-muted mt-5 flex items-start gap-2 px-1 text-sm">
            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-emerald-600" aria-hidden />
            {listings.length > 0
              ? t(dict.home.status, { routes: listings.length, places: counts.size })
              : dict.home.statusEmpty}
          </p>
          <h2 className="eyebrow mt-8 mb-3 px-1">
            {counts.size > 0 ? dict.home.popularPlaces : dict.home.startPlaces}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {popular.map((place) => (
              <li key={place.id}>
                <Link href={paths.place(locale, place.slug)} className="chip">
                  {placeName(place, locale)}
                  {counts.has(place.id) && (
                    <span className="text-subtle">{counts.get(place.id)}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <RecentCard locale={locale} dict={dict} recent={recent} />
      </section>

      <section className="bg-ink mt-16 rounded-[2rem] p-8 text-white md:p-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-center">
          <div className="flex-1">
            <p className="text-sm font-medium text-white/60">{dict.home.driversEyebrow}</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              {dict.home.driversTitle}
            </h2>
            <ul className="mt-6 space-y-3">
              {dict.home.driversPoints.map((point) => (
                <li key={point} className="flex items-start gap-3 text-white/85">
                  <Check className="mt-0.5 size-5 shrink-0" aria-hidden />
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <Link
            href={paths.add(locale)}
            className="btn btn-primary min-h-12 self-start px-7 text-base md:self-center"
          >
            {dict.home.driversCta}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <div className="mt-10 grid gap-6 border-t border-white/15 pt-8 md:grid-cols-3">
          {dict.home.how.map((step, i) => (
            <div key={step.title}>
              <p className="text-sm font-semibold text-white">
                <span className="mr-2 text-white/50">{i + 1}</span>
                {step.title}
              </p>
              <p className="mt-1.5 text-sm text-white/65">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-2xl font-semibold tracking-tight">{dict.home.moreTitle}</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={paths.map(locale)} className="chip">
            {dict.nav.map}
          </Link>
          <Link href={paths.add(locale)} className="chip">
            {dict.nav.add}
          </Link>
          <Link href={paths.about(locale)} className="chip">
            {dict.nav.about}
          </Link>
        </div>
      </section>
    </div>
  );
}

function RecentCard({
  locale,
  dict,
  recent,
}: {
  locale: Locale;
  dict: Dictionary;
  recent: ListingView[];
}) {
  return (
    <aside className="card self-start overflow-hidden">
      <div className="px-5 pt-5 pb-4">
        <p className="eyebrow">{dict.home.recentEyebrow}</p>
        <h2 className="mt-0.5 text-xl font-semibold tracking-tight">{dict.home.recentTitle}</h2>
      </div>
      {recent.length === 0 ? (
        <p className="border-line text-muted border-t px-5 py-5">{dict.home.recentEmpty}</p>
      ) : (
        <ul>
          {recent.map((listing) => {
            const first = listing.stops[0];
            const last = listing.stops.at(-1)!;
            return (
              <li key={listing.id} className="border-line border-t">
                <Link
                  href={paths.listing(locale, listing.id)}
                  className="hover:bg-canvas/60 flex items-center gap-3 px-5 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      {placeName(first, locale)} → {placeName(last, locale)}
                    </p>
                    <p className="text-muted mt-0.5 text-sm">
                      {listing.departureTime}
                      {listing.pricePerSeat !== null && <> · {listing.pricePerSeat}₾</>} ·{" "}
                      {listing.verifiedDaysAgo === 0
                        ? dict.listing.verifiedToday
                        : listing.verifiedDaysAgo === 1
                          ? dict.listing.verifiedYesterday
                          : t(dict.listing.verifiedDays, { count: listing.verifiedDaysAgo! })}
                    </p>
                  </div>
                  <ChevronRight className="text-subtle size-4 shrink-0" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <div className="border-line space-y-4 border-t p-5">
        <Link href={paths.map(locale)} className="btn btn-secondary w-full">
          {dict.home.seeMap}
        </Link>
        <Link
          href={paths.add(locale)}
          className="text-brand-700 block px-1 text-[15px] font-medium hover:underline"
        >
          {dict.nav.add} →
        </Link>
      </div>
    </aside>
  );
}
