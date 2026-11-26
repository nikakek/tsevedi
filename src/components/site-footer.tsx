import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { GITHUB_URL, paths } from "@/lib/paths";
import { Logo } from "./logo";

export function SiteFooter({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <footer className="border-line bg-surface mt-16 border-t">
      <div className="text-muted mx-auto grid max-w-5xl gap-6 px-4 py-8 text-sm sm:grid-cols-[1fr_auto]">
        <div className="space-y-2">
          <div className="text-ink flex items-center gap-2 font-semibold">
            <Logo className="text-brand-600 size-5" />
            {dict.meta.siteName}
          </div>
          <p>{dict.footer.tagline}</p>
          <p className="text-xs">{dict.footer.disclaimer}</p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 sm:flex-col sm:text-right">
          <Link href={paths.map(locale)} className="hover:text-ink">
            {dict.nav.map}
          </Link>
          <Link href={paths.add(locale)} className="hover:text-ink">
            {dict.nav.add}
          </Link>
          <Link href={paths.about(locale)} className="hover:text-ink">
            {dict.nav.about}
          </Link>
          <a href={GITHUB_URL} className="hover:text-ink" rel="noopener">
            {dict.footer.openSource}
          </a>
        </nav>
      </div>
    </footer>
  );
}
