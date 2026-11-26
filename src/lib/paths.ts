import type { Locale } from "@/i18n/config";

/** Central place for URLs so pages, sitemap and API responses stay consistent. */
export const paths = {
  home: (locale: Locale) => `/${locale}`,
  route: (locale: Locale, from: string, to: string, date?: string | null) =>
    `/${locale}/routes/${from}/${to}${date ? `?date=${date}` : ""}`,
  place: (locale: Locale, slug: string) => `/${locale}/places/${slug}`,
  listing: (locale: Locale, id: string) => `/${locale}/listings/${id}`,
  add: (locale: Locale, from?: string, to?: string) =>
    `/${locale}/add${from && to ? `?from=${from}&to=${to}` : ""}`,
  map: (locale: Locale) => `/${locale}/map`,
  about: (locale: Locale) => `/${locale}/about`,
  privacy: (locale: Locale) => `/${locale}/privacy`,
  signIn: (locale: Locale, next?: string) =>
    `/${locale}/signin${next ? `?next=${encodeURIComponent(next)}` : ""}`,
  account: (locale: Locale) => `/${locale}/account`,
  driver: (locale: Locale) => `/${locale}/driver`,
  driverRegister: (locale: Locale) => `/${locale}/driver/register`,
  driverNewRoute: (locale: Locale) => `/${locale}/driver/routes/new`,
  driverEditRoute: (locale: Locale, id: string) => `/${locale}/driver/routes/${id}`,
};

/** Only allow redirects to our own pages after sign-in (prevents open redirects). */
export function safeNext(next: unknown, fallback: string): string {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
    ? next
    : fallback;
}

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);
export const GITHUB_URL = "https://github.com/nikakek/tsevedi";
