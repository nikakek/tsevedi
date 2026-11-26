import { ArrowLeft, Luggage, Repeat } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ListingCard, tripFor } from "@/components/listing-card";
import { ProblemReportForm, RideReportForm } from "@/components/report-forms";
import { PageSkeleton } from "@/components/skeletons";
import { TodayInGeorgia } from "@/components/today";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { formatDate, placeName, placeVars, t } from "@/i18n/format";
import { paths } from "@/lib/paths";
import { getListing } from "@/server/queries";
import { problemReportAction, rideReportAction } from "../../actions";

type Props = PageProps<"/[locale]/listings/[id]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  if (!isLocale(locale)) return {};
  const [dict, listing] = await Promise.all([getDictionary(locale), getListing(id)]);
  if (!listing) return {};
  const { board, alight } = tripFor(listing);
  const vars = { ...placeVars(board, locale, "from"), ...placeVars(alight, locale, "to") };
  return {
    title: `${t(dict.route.heading, { from: placeName(board, locale), to: placeName(alight, locale) })} ${listing.departureTime}`,
    description: t(dict.meta.routeDescription, vars),
    alternates: { canonical: paths.listing(locale, id) },
  };
}

export default function ListingPage({ params }: Props) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Suspense fallback={<PageSkeleton />}>
        <ListingContent params={params} />
      </Suspense>
    </div>
  );
}

async function ListingContent({ params }: Pick<Props, "params">) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const [dict, listing] = await Promise.all([getDictionary(locale), getListing(id)]);
  if (!listing) notFound();
  const { board, alight, ordered } = tripFor(listing);

  return (
    <>
      <Link
        href={paths.route(locale, board.slug, alight.slug)}
        className="text-muted hover:text-ink mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden /> {dict.listing.backToRoute}
      </Link>
      <h1 className="mb-4 text-2xl font-bold">
        {t(dict.route.heading, { from: placeName(board, locale), to: placeName(alight, locale) })}
      </h1>

      <ListingCard listing={listing} locale={locale} dict={dict} showDetailsLink={false} />

      <section className="card mt-4 space-y-4 p-4 text-sm sm:p-5">
        <div>
          <h2 className="mb-2 font-semibold">{dict.listing.stops}</h2>
          <ol className="border-brand-200 relative ml-2 space-y-2 border-l-2 pl-4">
            {ordered.map((stop) => (
              <li key={stop.id} className="relative">
                <span
                  className="bg-brand-600 absolute top-1.5 -left-[1.4rem] size-2.5 rounded-full"
                  aria-hidden
                />
                <Link href={paths.place(locale, stop.slug)} className="hover:underline">
                  {placeName(stop, locale)}
                </Link>
              </li>
            ))}
          </ol>
        </div>
        {listing.returnTime && (
          <p className="flex items-start gap-2">
            <Repeat className="text-muted mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              <strong>{dict.listing.returnTrip}:</strong> {listing.returnTime}
              {listing.returnPoint && <> · {listing.returnPoint}</>}
            </span>
          </p>
        )}
        {listing.priceWholeVehicle !== null && (
          <p>
            <strong>{dict.listing.wholeVehicle}:</strong> {listing.priceWholeVehicle}{" "}
            {dict.listing.gel}
          </p>
        )}
        {listing.largeLuggage !== null && (
          <p className="flex items-center gap-2">
            <Luggage className="text-muted size-4" aria-hidden />
            {listing.largeLuggage ? dict.listing.largeLuggageOk : dict.listing.largeLuggageNo}
          </p>
        )}
        {listing.notes && (
          <div>
            <h2 className="mb-1 font-semibold">{dict.listing.notes}</h2>
            <p className="text-muted whitespace-pre-line">{listing.notes}</p>
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold">{dict.reports.title}</h2>
        {listing.rideReports.length === 0 ? (
          <p className="text-muted mb-4">{dict.reports.empty}</p>
        ) : (
          <ul className="mb-4 space-y-2">
            {listing.rideReports.map((report) => (
              <li key={report.id} className="card p-3 text-sm">
                <div className="flex flex-wrap items-center gap-x-2">
                  <span className="font-medium">{formatDate(report.travelDate, locale)}</span>
                  <span
                    className={
                      report.outcome === "WORKED"
                        ? "text-emerald-700"
                        : report.outcome === "DID_NOT_RUN"
                          ? "text-brand-700"
                          : "text-amber-700"
                    }
                  >
                    {dict.reports.outcomes[report.outcome]}
                  </span>
                  {report.departedAt && <span className="text-muted">· {report.departedAt}</span>}
                  {report.pricePaid !== null && (
                    <span className="text-muted">· {report.pricePaid}₾</span>
                  )}
                </div>
                {report.comment && <p className="text-muted mt-1">{report.comment}</p>}
              </li>
            ))}
          </ul>
        )}
        <div className="space-y-4">
          <TodayInGeorgia>
            {(today) => (
              <RideReportForm
                action={rideReportAction.bind(null, listing.id)}
                dict={dict.reports}
                validation={dict.validation}
                today={today}
              />
            )}
          </TodayInGeorgia>
          <div>
            <ProblemReportForm
              action={problemReportAction.bind(null, listing.id)}
              dict={dict.reports}
            />
          </div>
        </div>
      </section>
    </>
  );
}
