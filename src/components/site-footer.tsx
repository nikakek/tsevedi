import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { GITHUB_URL, paths } from "@/lib/paths";
import { Logo } from "./logo";

export function SiteFooter({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 text-sm text-muted sm:grid-cols-[1fr_auto]">
        <div className="space-y-2">
          <div className="flex items-center gap-2 font-semibold text-ink">
            <Logo className="size-5 text-brand-600" />
            {dict.meta.siteName}
          </div>
          <p>{dict.footer.tagline}</p>
          <p className="text-xs">{dict.footer.disclaimer}</p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 sm:flex-col sm:text-right">
          <Link href={paths.map(locale)} className="hover:text-ink">{dict.nav.map}</Link>
          <Link href={paths.add(locale)} className="hover:text-ink">{dict.nav.add}</Link>
          <Link href={paths.about(locale)} className="hover:text-ink">{dict.nav.about}</Link>
          <a href={GITHUB_URL} className="hover:text-ink" rel="noopener">{dict.footer.openSource}</a>
        </nav>
      </div>
    </footer>
  );
}
