export const LOCALES = ["ka", "en", "ru"] as const;
export type Locale = (typeof LOCALES)[number];

/** Used when the browser does not ask for any language we support (most visitors are tourists). */
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_COOKIE = "NEXT_LOCALE";

export const LOCALE_LABELS: Record<Locale, string> = {
  ka: "ქართული",
  en: "English",
  ru: "Русский",
};

/** BCP 47 tags for <html lang>, hreflang and Intl formatting. */
export const LOCALE_TAGS: Record<Locale, string> = {
  ka: "ka-GE",
  en: "en",
  ru: "ru",
};

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}
