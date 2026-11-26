import Link from "next/link";
import { Map, Plus } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { paths } from "@/lib/paths";
import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "./logo";

export function SiteHeader({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4">
        <Link href={paths.home(locale)} className="mr-auto flex items-center gap-2 font-bold tracking-tight">
          <Logo className="size-7 text-brand-600" />
          <span className="text-lg">{dict.meta.siteName}</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm font-medium">
          <Link
            href={paths.map(locale)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-muted hover:bg-canvas hover:text-ink"
          >
            <Map className="size-4" aria-hidden />
            <span className="hidden sm:inline">{dict.nav.map}</span>
          </Link>
          <Link
            href={paths.add(locale)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-brand-700 hover:bg-brand-50"
          >
            <Plus className="size-4" aria-hidden />
            <span className="hidden sm:inline">{dict.nav.add}</span>
          </Link>
          <LanguageSwitcher locale={locale} label={dict.nav.language} />
        </nav>
      </div>
    </header>
  );
}
