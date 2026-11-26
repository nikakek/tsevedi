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
};

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);
export const GITHUB_URL = "https://github.com/nikakek/tsevedi";
