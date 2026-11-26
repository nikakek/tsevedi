import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, LOCALES } from "@/i18n/config";
import { negotiateLocale } from "@/i18n/negotiate";

/** Sends visitors without a language prefix to /ka, /en or /ru based on their browser or saved choice. */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasLocale = LOCALES.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (hasLocale) return;

  const locale = negotiateLocale(
    request.headers.get("accept-language"),
    request.cookies.get(LOCALE_COOKIE)?.value,
  );
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip API routes, the admin area, Next.js internals and files with an extension (robots.txt, icons, ...).
  matcher: ["/((?!api|admin|_next|.*\\..*).*)"],
};
