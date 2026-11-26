"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { LOCALE_COOKIE, LOCALE_LABELS, LOCALES, type Locale } from "@/i18n/config";

function swapLocale(pathname: string, locale: Locale) {
  const parts = pathname.split("/");
  parts[1] = locale;
  return parts.join("/") || `/${locale}`;
}

function remember(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

function Links({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  return LOCALES.map((l) => (
    <Link
      key={l}
      href={`${swapLocale(pathname, l)}${search ? `?${search}` : ""}`}
      onClick={() => remember(l)}
      hrefLang={l}
      lang={l}
      aria-current={l === locale ? "true" : undefined}
      title={LOCALE_LABELS[l]}
      className="rounded-md px-2 py-1 text-xs font-semibold text-muted aria-[current]:bg-ink aria-[current]:text-white hover:text-ink aria-[current]:hover:text-white"
    >
      {l === "ka" ? "ქა" : l === "ru" ? "РУ" : "EN"}
    </Link>
  ));
}

export function LanguageSwitcher({ locale, label }: { locale: Locale; label: string }) {
  return (
    <div role="group" aria-label={label} className="ml-1 flex items-center gap-0.5 rounded-lg border border-line p-0.5">
      <Suspense fallback={<span className="px-2 py-1 text-xs font-semibold uppercase">{locale}</span>}>
        <Links locale={locale} />
      </Suspense>
    </div>
  );
}
