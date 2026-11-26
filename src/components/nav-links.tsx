"use client";

import { Info, Map, Plus, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import type { Locale } from "@/i18n/config";
import { paths } from "@/lib/paths";

type Labels = {
  search: string;
  map: string;
  add: string;
  about: string;
  short: { map: string; add: string; about: string };
};
type Props = { locale: Locale; labels: Labels };

function items(locale: Locale, labels: Labels) {
  return [
    {
      href: paths.home(locale),
      label: labels.search,
      icon: Search,
      match: (p: string) => p === `/${locale}` || p.includes("/routes/"),
    },
    {
      href: paths.map(locale),
      label: labels.map,
      icon: Map,
      match: (p: string) => p.endsWith("/map"),
    },
    {
      href: paths.add(locale),
      label: labels.add,
      icon: Plus,
      match: (p: string) => p.endsWith("/add"),
    },
    {
      href: paths.about(locale),
      label: labels.about,
      icon: Info,
      match: (p: string) => p.endsWith("/about"),
    },
  ];
}

function HeaderLinks({ locale, labels, pathname }: Props & { pathname: string | null }) {
  return items(locale, labels).map((item) => (
    <Link
      key={item.href}
      href={item.href}
      aria-current={pathname && item.match(pathname) ? "page" : undefined}
      className="text-muted hover:text-ink aria-[current=page]:text-ink rounded-full px-4 py-2 text-[15px] font-medium"
    >
      {item.label}
    </Link>
  ));
}

function TabLinks({ locale, labels, pathname }: Props & { pathname: string | null }) {
  const short = { ...labels, ...labels.short };
  return items(locale, short).map(({ href, label, icon: Icon, match }) => (
    <Link
      key={href}
      href={href}
      aria-current={pathname && match(pathname) ? "page" : undefined}
      className="text-subtle aria-[current=page]:text-brand-700 flex flex-col items-center gap-0.5 rounded-full py-1.5 text-[11px] font-medium"
    >
      <Icon className="size-5" aria-hidden />
      <span className="max-w-full truncate px-1">{label}</span>
    </Link>
  ));
}

// The current path is request data, so it is read inside Suspense; the fallback shows the same links unhighlighted.
function WithPath({ render }: { render: (pathname: string | null) => React.ReactNode }) {
  return <>{render(usePathname())}</>;
}

/** Centre links in the desktop header. */
export function HeaderNav(props: Props) {
  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
      <Suspense fallback={<HeaderLinks {...props} pathname={null} />}>
        <WithPath render={(pathname) => <HeaderLinks {...props} pathname={pathname} />} />
      </Suspense>
    </nav>
  );
}

/** Floating icon tab bar for phones. */
export function TabBar(props: Props) {
  return (
    <nav
      aria-label="Main"
      className="bg-surface/95 shadow-float fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 rounded-full p-1.5 ring-1 ring-black/5 backdrop-blur md:hidden"
    >
      <Suspense fallback={<TabLinks {...props} pathname={null} />}>
        <WithPath render={(pathname) => <TabLinks {...props} pathname={pathname} />} />
      </Suspense>
    </nav>
  );
}
