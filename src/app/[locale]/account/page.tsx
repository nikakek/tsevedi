import { ArrowRight, Bus, Clock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { DeleteAccountButton, SignOutButton } from "@/components/account-actions";
import { ListingCard } from "@/components/listing-card";
import { SaveButton } from "@/components/saved";
import { PageSkeleton } from "@/components/skeletons";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary, type Dictionary } from "@/i18n/dictionaries";
import { placeName, t } from "@/i18n/format";
import { paths } from "@/lib/paths";
import { PAGE } from "@/lib/ui";
import { getAccountOverview } from "@/server/accounts";
import { getCurrentUser } from "@/server/session";

type Props = PageProps<"/[locale]/account">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: dict.account.title, robots: { index: false } };
}

export default async function AccountPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <div className={`${PAGE} py-8`}>
      <Suspense fallback={<PageSkeleton />}>
        <AccountContent locale={locale} />
      </Suspense>
    </div>
  );
}

const STATUS_STYLE = {
  PENDING: "bg-warn-bg text-warn-fg",
  APPROVED: "bg-ok-bg text-ok-fg",
  REJECTED: "bg-brand-50 text-brand-800",
  ARCHIVED: "bg-canvas text-muted",
} as const;

async function AccountContent({ locale }: { locale: Locale }) {
  const user = await getCurrentUser();
  if (!user) redirect(paths.signIn(locale, paths.account(locale)));
  const [dict, overview] = await Promise.all([getDictionary(locale), getAccountOverview(user.id)]);
  const a = dict.account;

  return (
    <>
      <header className="mb-8 flex items-center gap-4">
        <div className="bg-canvas ring-line flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- remote avatar from Google/Facebook
            <img
              src={user.image}
              alt=""
              referrerPolicy="no-referrer"
              className="size-full object-cover"
            />
          ) : (
            <span className="text-2xl font-semibold">{user.name.slice(0, 1).toUpperCase()}</span>
          )}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-3xl font-semibold tracking-tight">{user.name}</h1>
          <p className="text-muted truncate">{user.email}</p>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_26rem]">
        <div className="space-y-10">
          <section>
            <h2 className="mb-4 text-2xl font-semibold tracking-tight">{a.savedTrips}</h2>
            {overview.trips.length === 0 ? (
              <p className="card text-muted p-6">{a.savedTripsEmpty}</p>
            ) : (
              <div className="grid gap-4 2xl:grid-cols-2">
                {overview.trips.map(({ id, listing }) =>
                  listing ? (
                    <ListingCard key={id} listing={listing} locale={locale} dict={dict} />
                  ) : (
                    <div
                      key={id}
                      className="card text-muted flex items-center justify-between gap-3 p-5"
                    >
                      {a.unavailable}
                      <SaveButton
                        type="listing"
                        id={id}
                        labels={{ save: dict.save.saveTrip, saved: dict.save.savedTrip }}
                        signInHref={paths.signIn(locale, paths.account(locale))}
                      />
                    </div>
                  ),
                )}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold tracking-tight">{a.savedDrivers}</h2>
            {overview.drivers.length === 0 ? (
              <p className="card text-muted p-6">{a.savedDriversEmpty}</p>
            ) : (
              <ul className="grid gap-4 xl:grid-cols-2">
                {overview.drivers.map((driver) => (
                  <li key={driver.id} className="card overflow-hidden">
                    <div className="flex items-center gap-3 px-5 pt-5 pb-4">
                      <Bus className="text-subtle size-5" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{driver.name}</p>
                        <p className="text-muted text-sm">
                          {driver.listings.length > 0
                            ? t(a.routesCount, { count: driver.listings.length })
                            : a.unavailable}
                        </p>
                      </div>
                      <SaveButton
                        type="driver"
                        id={driver.id}
                        labels={{ save: dict.save.saveDriver, saved: dict.save.savedDriver }}
                        signInHref={paths.signIn(locale, paths.account(locale))}
                      />
                    </div>
                    {driver.listings.map((listing) => (
                      <Link
                        key={listing.id}
                        href={paths.listing(locale, listing.id)}
                        className="border-line hover:bg-canvas/60 flex items-center gap-2 border-t px-5 py-3 text-sm"
                      >
                        <Clock className="text-subtle size-4" aria-hidden />
                        <span className="font-semibold tabular-nums">{listing.departureTime}</span>
                        <span className="min-w-0 truncate">
                          {placeName(listing.stops[0], locale)} →{" "}
                          {placeName(listing.stops.at(-1)!, locale)}
                        </span>
                        <ArrowRight className="text-subtle ml-auto size-4 shrink-0" aria-hidden />
                      </Link>
                    ))}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold tracking-tight">{a.submissions}</h2>
            {overview.submissions.length === 0 ? (
              <p className="card text-muted p-6">{a.submissionsEmpty}</p>
            ) : (
              <ul className="card overflow-hidden">
                {overview.submissions.map((listing, i) => (
                  <li
                    key={listing.id}
                    className={`flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-4 ${i > 0 ? "border-line border-t" : ""}`}
                  >
                    <span className="font-semibold tabular-nums">{listing.departureTime}</span>
                    <span className="min-w-0 flex-1">
                      {listing.stops.map((s) => placeName(s.place, locale)).join(" → ")}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[listing.status]}`}
                    >
                      {a.status[listing.status]}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <DriverCard locale={locale} dict={dict} status={overview.driver?.status ?? null} />
          <div className="card space-y-3 p-5">
            <SignOutButton label={dict.nav.signOut} homeHref={paths.home(locale)} />
          </div>
          <div className="card p-5">
            <h2 className="font-semibold">{a.deleteTitle}</h2>
            <p className="text-muted mt-1 mb-4 text-sm">{a.deleteText}</p>
            <DeleteAccountButton
              labels={{ button: a.deleteButton, confirm: a.deleteConfirm, error: dict.auth.error }}
              homeHref={paths.home(locale)}
            />
          </div>
        </aside>
      </div>
    </>
  );
}

function DriverCard({
  locale,
  dict,
  status,
}: {
  locale: Locale;
  dict: Dictionary;
  status: "UNCLAIMED" | "PENDING" | "APPROVED" | "REJECTED" | null;
}) {
  const a = dict.account;
  if (status === "APPROVED") {
    return (
      <div className="bg-panel ring-line rounded-[1.75rem] p-6 text-white ring-1">
        <p className="font-semibold">{dict.driver.dashboardTitle}</p>
        <Link href={paths.driver(locale)} className="btn btn-primary mt-4 w-full">
          {a.driverAreaCta}
        </Link>
      </div>
    );
  }
  if (status === "PENDING") {
    return <div className="bg-warn-bg text-warn-fg rounded-[1.75rem] p-6">{a.driverPending}</div>;
  }
  if (status === "REJECTED") {
    return (
      <div className="bg-brand-50 text-brand-800 rounded-[1.75rem] p-6">
        <p className="font-semibold">{dict.driver.rejectedTitle}</p>
        <p className="mt-1 text-sm">{dict.driver.rejectedText}</p>
      </div>
    );
  }
  return (
    <div className="bg-panel ring-line rounded-[1.75rem] p-6 text-white ring-1">
      <p className="text-lg font-semibold">{a.driverCtaTitle}</p>
      <p className="mt-1 text-sm text-white/70">{a.driverCtaText}</p>
      <Link href={paths.driverRegister(locale)} className="btn btn-primary mt-4 w-full">
        {a.driverCta}
      </Link>
    </div>
  );
}
