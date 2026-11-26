import { CheckCircle2, Clock, Hourglass, Pencil, Plus, XCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { ConfirmSubmit } from "@/components/account-actions";
import { SignInRequired } from "@/components/sign-in-required";
import { PageSkeleton } from "@/components/skeletons";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { placeName, t } from "@/i18n/format";
import { daysSince } from "@/lib/freshness";
import { formatPhone } from "@/lib/phone";
import { paths } from "@/lib/paths";
import { formatDays } from "@/lib/schedule";
import { PAGE } from "@/lib/ui";
import { getDriverContext } from "@/server/driver-page";
import { getDriverListings } from "@/server/drivers";
import { archiveDriverRouteAction, confirmDriverRouteAction } from "../actions";

type Props = PageProps<"/[locale]/driver">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: dict.driver.dashboardTitle, robots: { index: false } };
}

export default async function DriverPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <div className={`${PAGE} py-8`}>
      <Suspense fallback={<PageSkeleton />}>
        <DriverContent locale={locale} />
      </Suspense>
    </div>
  );
}

async function DriverContent({ locale }: { locale: Locale }) {
  const [dict, { user, driver }] = await Promise.all([getDictionary(locale), getDriverContext()]);
  const d = dict.driver;
  if (!user) return <SignInRequired locale={locale} dict={dict} next={paths.driver(locale)} />;
  if (!driver) redirect(paths.driverRegister(locale));

  if (driver.status === "PENDING" || driver.status === "REJECTED") {
    const pending = driver.status === "PENDING";
    const Icon = pending ? Hourglass : XCircle;
    return (
      <div className="card mx-auto max-w-xl p-8 text-center">
        <Icon
          className={`mx-auto size-12 ${pending ? "text-warn-fg" : "text-brand-600"}`}
          aria-hidden
        />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          {pending ? d.pendingTitle : d.rejectedTitle}
        </h1>
        <p className="text-muted mt-2">
          {pending ? t(d.pendingText, { phone: formatPhone(driver.phone) }) : d.rejectedText}
        </p>
        <Link href={paths.account(locale)} className="btn btn-secondary mt-6">
          {dict.nav.account}
        </Link>
      </div>
    );
  }

  const listings = await getDriverListings(driver.id);
  return (
    <>
      <header className="mb-6 flex flex-wrap items-end gap-4">
        <div className="mr-auto">
          <p className="eyebrow flex items-center gap-1.5">
            <CheckCircle2 className="text-ok-fg size-4" aria-hidden /> {driver.name}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{d.dashboardTitle}</h1>
        </div>
        <Link href={paths.driverNewRoute(locale)} className="btn btn-primary min-h-12 px-6">
          <Plus className="size-4" aria-hidden /> {d.addRoute}
        </Link>
      </header>
      <p className="bg-ok-bg text-ok-fg mb-6 max-w-3xl rounded-[1.75rem] p-5 text-sm">
        {d.publishedNote}
      </p>

      <h2 className="mb-4 text-2xl font-semibold tracking-tight">{d.yourRoutes}</h2>
      {listings.length === 0 ? (
        <p className="card text-muted p-6">{d.noRoutes}</p>
      ) : (
        <ul className="grid gap-4 xl:grid-cols-2">
          {listings.map((listing) => {
            const confirmedDays = listing.lastConfirmedAt
              ? daysSince(listing.lastConfirmedAt)
              : null;
            return (
              <li key={listing.id} className="card p-5">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-2xl font-semibold tabular-nums">
                    {listing.departureTime}
                  </span>
                  <span className="font-semibold">
                    {listing.stops.map((s) => placeName(s.place, locale)).join(" → ")}
                  </span>
                </div>
                <p className="text-muted mt-1 flex flex-wrap items-center gap-x-3 text-sm">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3.5" aria-hidden />
                    {formatDays(listing.days, locale) ?? dict.listing.daily}
                  </span>
                  {listing.pricePerSeat !== null && <span>{listing.pricePerSeat}₾</span>}
                  {listing.returnTime && (
                    <span>
                      {dict.listing.returnTrip}: {listing.returnTime}
                    </span>
                  )}
                </p>
                <p className="text-subtle mt-1 text-xs">
                  {confirmedDays === null
                    ? dict.listing.unverified
                    : confirmedDays === 0
                      ? dict.listing.verifiedToday
                      : t(dict.listing.verifiedDays, { count: confirmedDays })}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <form action={confirmDriverRouteAction.bind(null, listing.id)}>
                    <button className="btn btn-primary">
                      <CheckCircle2 className="size-4" aria-hidden /> {d.confirm}
                    </button>
                  </form>
                  <Link
                    href={paths.driverEditRoute(locale, listing.id)}
                    className="btn btn-secondary"
                  >
                    <Pencil className="size-4" aria-hidden /> {d.edit}
                  </Link>
                  <form action={archiveDriverRouteAction.bind(null, listing.id)}>
                    <ConfirmSubmit
                      label={d.remove}
                      confirm={d.removeConfirm}
                      className="btn text-muted hover:text-brand-700"
                    />
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
