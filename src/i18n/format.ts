import { kaFrom, kaLocative } from "@/lib/phrases";
import { LOCALE_TAGS, type Locale } from "./config";

/** Replaces {name} placeholders. Unknown placeholders are left as they are. */
export function t(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

export type NamedPlace = { nameKa: string; nameEn: string; nameRu: string };

export function placeName(place: NamedPlace, locale: Locale): string {
  return locale === "ka" ? place.nameKa : locale === "ru" ? place.nameRu : place.nameEn;
}

/**
 * Template variables for a place: `{prefix}` is the name, and in Georgian `{prefix}Loc` / `{prefix}Abl`
 * carry the "to"/"from" case endings ("ონში" / "ონიდან"). Other languages reuse the plain name.
 */
export function placeVars(place: NamedPlace, locale: Locale, prefix = "place") {
  const name = placeName(place, locale);
  return {
    [prefix]: name,
    [`${prefix}Loc`]: locale === "ka" ? kaLocative(place.nameKa) : name,
    [`${prefix}Abl`]: locale === "ka" ? kaFrom(place.nameKa) : name,
  };
}

export function formatDate(isoDate: string, locale: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
    weekday: "short",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T00:00:00Z`));
}
