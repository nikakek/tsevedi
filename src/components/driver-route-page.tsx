import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { driverRouteAction } from "@/app/[locale]/actions";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { toComboPlaces } from "@/lib/combo-places";
import { paths } from "@/lib/paths";
import { getDriverContext } from "@/server/driver-page";
import { getDriverListingForEdit } from "@/server/drivers";
import { getPlaces } from "@/server/queries";
import { SignInRequired } from "./sign-in-required";
import { SubmitForm } from "./submit-form";

/** Add (listingId null) or edit one of the signed-in driver's routes. */
export async function DriverRouteEditor({
  locale,
  listingId,
}: {
  locale: Locale;
  listingId: string | null;
}) {
  const [dict, places, { user, driver }] = await Promise.all([
    getDictionary(locale),
    getPlaces(),
    getDriverContext(),
  ]);
  const self = listingId ? paths.driverEditRoute(locale, listingId) : paths.driverNewRoute(locale);
  if (!user) return <SignInRequired locale={locale} dict={dict} next={self} />;
  if (driver?.status !== "APPROVED") redirect(paths.driver(locale));

  const existing = listingId ? await getDriverListingForEdit(driver.id, listingId) : null;
  if (listingId && !existing) redirect(paths.driver(locale));

  return (
    <>
      <Link
        href={paths.driver(locale)}
        className="text-muted hover:text-ink mb-4 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden /> {dict.driver.backToDashboard}
      </Link>
      <h1 className="mb-6 text-3xl font-semibold tracking-tight md:text-4xl">
        {listingId ? dict.driver.editRoute : dict.driver.addRoute}
      </h1>
      <div className="max-w-3xl">
        <SubmitForm
          locale={locale}
          dict={dict}
          places={toComboPlaces(places)}
          action={driverRouteAction.bind(null, listingId)}
          mode="driver-route"
          submitLabel={listingId ? dict.driver.save : dict.driver.addRoute}
          successHref={paths.driver(locale)}
          initial={
            existing
              ? {
                  stops: existing.stopSlugs,
                  departureTime: existing.departureTime,
                  days: existing.days,
                  activeMonths: existing.activeMonths,
                  departurePoint: existing.departurePoint,
                  departureMapsUrl: existing.departureMapsUrl,
                  returnTime: existing.returnTime,
                  returnPoint: existing.returnPoint,
                  pricePerSeat: existing.pricePerSeat,
                  priceWholeVehicle: existing.priceWholeVehicle,
                  largeLuggage: existing.largeLuggage,
                  callAhead: existing.callAhead,
                  notes: existing.notes,
                }
              : undefined
          }
        />
      </div>
    </>
  );
}
