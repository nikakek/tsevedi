import { ArrowRight, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/skeletons";
import { isLocale, LOCALE_TAGS, LOCALES, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { placeName, placeVars, t } from "@/i18n/format";
import { paths } from "@/lib/paths";
import { regionName } from "@/lib/regions";
import { getPlaceBySlug, getPlaceRoutes, type PlaceSummary } from "@/server/queries";

type Props = PageProps<"/[locale]/places/[slug]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const [dict, place] = await Promise.all([getDictionary(locale), getPlaceBySlug(slug)]);
  if (!place) return {};
  const vars = placeVars(place, locale);
  return {
    title: t(dict.meta.placeTitle, vars),
    description: t(dict.meta.placeDescription, vars),
    alternates: {
      canonical: paths.place(locale, slug),
      languages: Object.fromEntries(LOCALES.map((l) => [LOCALE_TAGS[l], paths.place(l, slug)])),
    },
  };
}

export default function PlacePage({ params }: Props) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Suspense fallback={<PageSkeleton />}>
        <PlaceContent params={params} />
      </Suspense>
    </div>
  );
}

function RouteList({
  locale,
  title,
  from,
  places,
  reverse,
}: {
  locale: Locale;
  title: string;
  from: PlaceSummary;
  places: PlaceSummary[];
  reverse?: boolean;
}) {
  if (places.length === 0) return null;
  return (
    <section className="card mt-6 overflow-hidden">
      <h2 className="px-5 pt-5 pb-4 text-xl font-semibold tracking-tight">{title}</h2>
      <ul>
        {places
          .toSorted((a, b) => placeName(a, locale).localeCompare(placeName(b, locale)))
          .map((other) => {
            const [a, b] = reverse ? [other, from] : [from, other];
            return (
              <li key={other.id} className="border-line border-t">
                <Link
                  href={paths.route(locale, a.slug, b.slug)}
                  className="hover:bg-canvas/60 flex items-center gap-2 px-5 py-4"
                >
                  <span>{placeName(a, locale)}</span>
                  <ArrowRight className="text-subtle size-4" aria-hidden />
                  <span className="font-semibold">{placeName(b, locale)}</span>
                  <ChevronRight className="text-subtle ml-auto size-4" aria-hidden />
                </Link>
              </li>
            );
          })}
      </ul>
    </section>
  );
}

async function PlaceContent({ params }: Pick<Props, "params">) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const [dict, place] = await Promise.all([getDictionary(locale), getPlaceBySlug(slug)]);
  if (!place) notFound();
  const { destinations, origins } = await getPlaceRoutes(place.id);
  const vars = placeVars(place, locale);

  return (
    <>
      <p className="text-muted text-sm">
        {dict.place.region}: {regionName(place.region, locale)}
      </p>
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
        {t(dict.place.heading, vars)}
      </h1>
      {destinations.length === 0 && origins.length === 0 ? (
        <div className="card mt-6 p-6 text-center">
          <p className="text-muted">{t(dict.place.none, vars)}</p>
          <Link href={paths.add(locale)} className="btn btn-primary mt-4">
            {dict.nav.add}
          </Link>
        </div>
      ) : (
        <>
          <RouteList
            locale={locale}
            title={t(dict.place.from, vars)}
            from={place}
            places={destinations}
          />
          <RouteList
            locale={locale}
            title={t(dict.place.to, vars)}
            from={place}
            places={origins}
            reverse
          />
        </>
      )}
    </>
  );
}
