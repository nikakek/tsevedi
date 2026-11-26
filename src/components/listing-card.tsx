import {
  ArrowRight,
  Bus,
  Car,
  ChevronRight,
  Clock,
  MapPin,
  MessageCircle,
  Phone,
  PhoneCall,
  Send,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { placeName, placeVars, t } from "@/i18n/format";
import { contactLinks, formatPhone } from "@/lib/phone";
import { paths } from "@/lib/paths";
import { callForMePhrase, driverCardPhrase, messagePhrase } from "@/lib/phrases";
import { stopsInTravelOrder, type RouteMatch } from "@/lib/route-matching";
import { formatDays, formatMonths } from "@/lib/schedule";
import type { ListingView, PlaceSummary } from "@/server/queries";
import { FreshnessBadge } from "./freshness-badge";
import { PhraseCardButton, type PhraseCardContent } from "./phrase-card";

type Props = {
  listing: ListingView;
  locale: Locale;
  dict: Dictionary;
  /** When shown as a search result: which part of the route the traveller rides. */
  match?: RouteMatch;
  /** Highlight that the trip doesn't run on the searched date. */
  dimmed?: boolean;
  showDetailsLink?: boolean;
};

export function mapsLink(point: string, place: PlaceSummary, explicitUrl?: string | null) {
  if (explicitUrl) return explicitUrl;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${point}, ${place.nameEn}, Georgia`)}`;
}

export function tripFor(listing: ListingView, match?: RouteMatch) {
  const direction = match?.direction ?? "outbound";
  const ordered = stopsInTravelOrder(listing.stops, direction);
  const board = match ? listing.stops[match.boardIndex] : ordered[0];
  const alight = match ? listing.stops[match.alightIndex] : ordered.at(-1)!;
  const time = direction === "outbound" ? listing.departureTime : listing.returnTime!;
  const startsAtOrigin = board.id === ordered[0].id;
  // The listed departure point only applies where the trip starts.
  const point = startsAtOrigin
    ? direction === "outbound"
      ? listing.departurePoint
      : listing.returnPoint
    : null;
  const mapsUrl = direction === "outbound" && startsAtOrigin ? listing.departureMapsUrl : null;
  const boardPos = ordered.findIndex((s) => s.id === board.id);
  const alightPos = ordered.findIndex((s) => s.id === alight.id);
  const via = ordered.slice(boardPos + 1, alightPos);
  return { direction, ordered, board, alight, time, point, mapsUrl, via, startsAtOrigin };
}

export function phraseContent(
  listing: ListingView,
  board: PlaceSummary,
  alight: PlaceSummary,
  locale: Locale,
  dict: Dictionary,
): PhraseCardContent {
  const vars = { ...placeVars(board, locale, "from"), ...placeVars(alight, locale, "to") };
  return {
    buttonLabel: dict.listing.showCard,
    closeLabel: dict.phrase.close,
    meaningLabel: dict.phrase.meaning,
    driver: {
      title: dict.phrase.driverTitle,
      lines: driverCardPhrase({ toKa: alight.nameKa, price: listing.pricePerSeat }),
      meaning: listing.pricePerSeat
        ? t(dict.phrase.driverMeaning, { ...vars, price: listing.pricePerSeat })
        : t(dict.phrase.driverMeaningNoPrice, vars),
    },
    staff: {
      title: dict.phrase.staffTitle,
      hint: dict.phrase.staffHint,
      lines: callForMePhrase({ toKa: alight.nameKa, fromKa: board.nameKa }),
      meaning: t(dict.phrase.staffMeaning, vars),
      phone: formatPhone(listing.driver.phone),
    },
  };
}

export function VehicleIcon({ type, className }: { type: string; className?: string }) {
  return type === "SEDAN" || type === "SUV" ? (
    <Car className={className} aria-hidden />
  ) : (
    <Bus className={className} aria-hidden />
  );
}

export function ContactButtons({
  listing,
  board,
  alight,
  dict,
}: {
  listing: ListingView;
  board: PlaceSummary;
  alight: PlaceSummary;
  dict: Dictionary["listing"];
}) {
  const { driver } = listing;
  const message = messagePhrase({ toKa: alight.nameKa, fromKa: board.nameKa });
  return (
    <>
      <a href={contactLinks.call(driver.phone)} className="btn btn-primary">
        <Phone className="size-4" aria-hidden />
        {dict.call}
      </a>
      {driver.whatsapp && (
        <a
          href={contactLinks.whatsapp(driver.phone, message)}
          className="btn btn-secondary text-whatsapp"
          rel="noopener"
          target="_blank"
          title={dict.messageText}
        >
          <MessageCircle className="size-4" aria-hidden />
          {dict.whatsapp}
        </a>
      )}
      {driver.viber && (
        <a href={contactLinks.viber(driver.phone)} className="btn btn-secondary text-viber">
          <PhoneCall className="size-4" aria-hidden />
          {dict.viber}
        </a>
      )}
      {driver.telegram && (
        <a
          href={contactLinks.telegram(driver.phone)}
          className="btn btn-secondary text-telegram"
          rel="noopener"
          target="_blank"
        >
          <Send className="size-4" aria-hidden />
          {dict.telegram}
        </a>
      )}
    </>
  );
}

export function ListingCard({
  listing,
  locale,
  dict,
  match,
  dimmed,
  showDetailsLink = true,
}: Props) {
  const trip = tripFor(listing, match);
  const days = formatDays(listing.days, locale) ?? dict.listing.daily;
  const months = formatMonths(listing.activeMonths, locale);
  const { driver } = listing;
  const vehicle = [driver.vehicleColor, driver.vehicleModel].filter(Boolean).join(" ");

  return (
    <article className={`card overflow-hidden ${dimmed ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-start gap-x-4 gap-y-2 p-4 sm:p-5">
        <div className="min-w-[5.5rem]">
          <div className="text-3xl font-semibold tracking-tight tabular-nums md:text-4xl">
            {trip.time}
          </div>
          <div className="text-muted flex items-center gap-1 text-xs">
            <Clock className="size-3" aria-hidden />
            {days}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 font-semibold">
            <span>{placeName(trip.board, locale)}</span>
            <ArrowRight className="text-muted size-4" aria-hidden />
            <span>{placeName(trip.alight, locale)}</span>
          </div>
          {trip.via.length > 0 && (
            <p className="text-muted text-sm">
              {t(dict.listing.via, { stops: trip.via.map((s) => placeName(s, locale)).join(", ") })}
            </p>
          )}
          <div className="text-muted mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1">
              <VehicleIcon type={driver.vehicleType} className="size-4" />
              {dict.vehicle[driver.vehicleType]}
            </span>
            {driver.seats && (
              <span className="inline-flex items-center gap-1">
                <Users className="size-4" aria-hidden />
                {t(dict.listing.seats, { count: driver.seats })}
              </span>
            )}
            {months && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-800">
                {dict.listing.season}: {months}
              </span>
            )}
            {match?.direction === "return" && (
              <span className="bg-canvas rounded-full px-2 py-0.5 text-xs">
                {dict.listing.returnTrip}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          {listing.pricePerSeat !== null ? (
            <>
              <div className="text-2xl font-semibold tracking-tight">
                {listing.pricePerSeat}
                <span className="ml-0.5 text-lg">{dict.listing.gel}</span>
              </div>
              <div className="text-muted text-xs">{dict.listing.perSeat}</div>
            </>
          ) : (
            <div className="text-muted text-sm">{dict.listing.priceUnknown}</div>
          )}
        </div>
      </div>

      <div className="border-line space-y-2 border-t px-4 py-3 text-sm sm:px-5">
        {trip.point && (
          <p className="flex items-start gap-2">
            <MapPin className="text-brand-600 mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              <span className="text-muted">{dict.listing.from}: </span>
              {trip.point}{" "}
              <a
                href={mapsLink(trip.point, trip.board, trip.mapsUrl)}
                target="_blank"
                rel="noopener"
                className="text-brand-700 font-medium whitespace-nowrap underline-offset-2 hover:underline"
              >
                {dict.listing.openMap}
              </a>
            </span>
          </p>
        )}
        <p className="text-muted">
          <span className="text-ink font-medium">{driver.name}</span>
          {driver.languages.length > 0 && (
            <> · {driver.languages.map((l) => dict.language[l]).join(", ")}</>
          )}
          {vehicle && <> · {vehicle}</>}
          {driver.plate && (
            <>
              {" "}
              · <span className="font-mono">{driver.plate}</span>
            </>
          )}
        </p>
        {listing.callAhead && <p className="text-amber-800">{dict.listing.callAhead}</p>}
        <FreshnessBadge
          freshness={listing.freshness}
          daysAgo={listing.verifiedDaysAgo}
          dict={dict.listing}
        />
      </div>

      <div className="border-line flex flex-wrap gap-2 border-t px-4 py-4 sm:px-5">
        <ContactButtons
          listing={listing}
          board={trip.board}
          alight={trip.alight}
          dict={dict.listing}
        />
        <PhraseCardButton content={phraseContent(listing, trip.board, trip.alight, locale, dict)} />
        {showDetailsLink && (
          <Link
            href={paths.listing(locale, listing.id)}
            className="btn text-muted hover:text-ink ml-auto px-2"
          >
            {dict.listing.details}
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        )}
      </div>
    </article>
  );
}
