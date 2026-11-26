import { Info } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ListingCard } from "@/components/listing-card";
import { ResultsSkeleton } from "@/components/skeletons";
import { SearchForm } from "@/components/search-form";
import { isLocale, LOCALE_TAGS, LOCALES, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { formatDate, placeName, placeVars, t } from "@/i18n/format";
import { toComboPlaces } from "@/lib/combo-places";
import { paths } from "@/lib/paths";
import { PAGE } from "@/lib/ui";
import { isIsoDate } from "@/lib/schedule";
import { getPlaceBySlug, getPlaces, searchRoutes } from "@/server/queries";

type Props = PageProps<"/[locale]/routes/[from]/[to]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, from, to } = await params;
  if (!isLocale(locale)) return {};
  const [dict, fromPlace, toPlace] = await Promise.all([
    getDictionary(locale),
    getPlaceBySlug(from),
    getPlaceBySlug(to),
  ]);
  if (!fromPlace || !toPlace) return {};
  const vars = { ...placeVars(fromPlace, locale, "from"), ...placeVars(toPlace, locale, "to") };
  return {
    title: t(dict.meta.routeTitle, vars),
    description: t(dict.meta.routeDescription, vars),
    alternates: {
      canonical: paths.route(locale, from, to),
      languages: Object.fromEntries(LOCALES.map((l) => [LOCALE_TAGS[l], paths.route(l, from, to)])),
    },
  };
}

export default function RoutePage({ params, searchParams }: Props) {
  return (
    <div className={`${PAGE} py-6 md:py-8`}>
      <Suspense fallback={<ResultsSkeleton />}>
        <RouteResults params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function RouteResults({ params, searchParams }: Pick<Props, "params" | "searchParams">) {
  const [{ locale, from, to }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const [dict, places, fromPlace, toPlace] = await Promise.all([
    getDictionary(locale),
    getPlaces(),
    getPlaceBySlug(from),
    getPlaceBySlug(to),
  ]);
  if (!fromPlace || !toPlace || fromPlace.id === toPlace.id) notFound();

  const date = typeof query.date === "string" && isIsoDate(query.date) ? query.date : null;
  const { results, reverseCount } = await searchRoutes(fromPlace.id, toPlace.id, date);
  const running = date ? results.filter((r) => r.runsOnDate) : results;
  const notRunning = date ? results.filter((r) => !r.runsOnDate) : [];

  return (
    <>
      <div className="max-w-5xl">
        <SearchForm
          locale={locale}
          dict={dict.search}
          places={toComboPlaces(places)}
          initialFrom={from}
          initialTo={to}
          initialDate={date}
        />
      </div>

      <header className="mt-8 mb-5">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {t(dict.route.heading, {
            from: placeName(fromPlace, locale),
            to: placeName(toPlace, locale),
          })}
        </h1>
        {results.length > 0 && (
          <p className="text-muted mt-1">
            {date && <>{t(dict.route.showingDate, { date: formatDate(date, locale) })} · </>}
            {running.length === 1
              ? dict.route.resultsOne
              : t(dict.route.results, { count: running.length })}
            {date && (
              <>
                {" · "}
                <Link
                  href={paths.route(locale, from, to)}
                  className="text-brand-700 hover:underline"
                >
                  {dict.route.showAllDays}
                </Link>
              </>
            )}
          </p>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div>
          {results.length === 0 ? (
            <EmptyState
              locale={locale}
              dict={dict}
              from={from}
              to={to}
              reverseCount={reverseCount}
            />
          ) : (
            <div className="grid gap-4 2xl:grid-cols-2">
              {running.map((r) => (
                <ListingCard
                  key={`${r.listing.id}-${r.match.direction}`}
                  listing={r.listing}
                  match={r.match}
                  locale={locale}
                  dict={dict}
                />
              ))}
              {notRunning.length > 0 && date && (
                <>
                  <h2 className="text-muted pt-4 text-sm font-semibold uppercase 2xl:col-span-2">
                    {t(dict.route.notOnDate, { date: formatDate(date, locale) })}
                  </h2>
                  {notRunning.map((r) => (
                    <ListingCard
                      key={`${r.listing.id}-${r.match.direction}`}
                      listing={r.listing}
                      match={r.match}
                      locale={locale}
                      dict={dict}
                      dimmed
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <div className="bg-warn-bg text-warn-fg flex gap-3 rounded-[1.75rem] p-5 text-sm">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p>
              <strong>{dict.route.tipTitle}: </strong>
              {dict.route.tip}
            </p>
          </div>
          <div className="card space-y-3 p-5">
            <Link href={paths.place(locale, fromPlace.slug)} className="btn btn-secondary w-full">
              {t(dict.route.seeAlso, placeVars(fromPlace, locale))}
            </Link>
            {results.length > 0 && (
              <Link
                href={paths.add(locale, from, to)}
                className="text-brand-700 block px-1 text-[15px] font-medium hover:underline"
              >
                {dict.route.addCta} →
              </Link>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}

function EmptyState({
  locale,
  dict,
  from,
  to,
  reverseCount,
}: {
  locale: Locale;
  dict: Awaited<ReturnType<typeof getDictionary>>;
  from: string;
  to: string;
  reverseCount: number;
}) {
  return (
    <div className="card p-6 text-center">
      <h2 className="text-lg font-semibold">{dict.route.noResultsTitle}</h2>
      <p className="text-muted mx-auto mt-2 max-w-md">{dict.route.noResultsText}</p>
      <Link href={paths.add(locale, from, to)} className="btn btn-primary mt-4">
        {dict.route.addCta}
      </Link>
      {reverseCount > 0 && (
        <p className="text-muted mt-4 text-sm">
          {dict.route.noResultsReverse}{" "}
          <Link
            href={paths.route(locale, to, from)}
            className="text-brand-700 font-medium hover:underline"
          >
            {reverseCount} →
          </Link>
        </p>
      )}
    </div>
  );
}
