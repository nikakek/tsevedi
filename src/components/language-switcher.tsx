"use client";

import { Check, ChevronDown, Globe } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { LOCALE_COOKIE, LOCALE_LABELS, LOCALES, type Locale } from "@/i18n/config";

function swapLocale(pathname: string, locale: Locale) {
  const parts = pathname.split("/");
  parts[1] = locale;
  return parts.join("/") || `/${locale}`;
}

function remember(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

function Options({ locale, close }: { locale: Locale; close: () => void }) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  return LOCALES.map((l) => (
    <Link
      key={l}
      href={`${swapLocale(pathname, l)}${search ? `?${search}` : ""}`}
      onClick={() => {
        remember(l);
        close();
      }}
      hrefLang={l}
      lang={l}
      aria-current={l === locale ? "true" : undefined}
      className="hover:bg-canvas flex items-center justify-between gap-6 rounded-xl px-3 py-2.5 text-sm font-medium"
    >
      {LOCALE_LABELS[l]}
      {l === locale && <Check className="text-brand-600 size-4" aria-hidden />}
    </Link>
  ));
}

/** Pill button with a small menu, e.g. "🌐 English ⌄". Uses <details> so it opens without extra state. */
export function LanguageSwitcher({
  locale,
  label,
  align = "right",
  direction = "down",
}: {
  locale: Locale;
  label: string;
  align?: "left" | "right";
  direction?: "up" | "down";
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  const close = () => ref.current?.removeAttribute("open");

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) close();
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <details ref={ref} className="group relative">
      <summary
        aria-label={label}
        className="chip cursor-pointer list-none [&::-webkit-details-marker]:hidden"
      >
        <Globe className="size-4" aria-hidden />
        <span>{LOCALE_LABELS[locale]}</span>
        <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div
        role="menu"
        className={`border-line bg-surface shadow-float absolute z-50 min-w-44 rounded-2xl border p-1.5 ${
          align === "right" ? "right-0" : "left-0"
        } ${direction === "up" ? "bottom-full mb-2" : "top-full mt-2"}`}
      >
        <Suspense fallback={null}>
          <Options locale={locale} close={close} />
        </Suspense>
      </div>
    </details>
  );
}
