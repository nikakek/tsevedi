import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { GITHUB_URL, paths } from "@/lib/paths";
import { LanguageSwitcher } from "./language-switcher";
import { PAGE } from "@/lib/ui";

export function SiteFooter({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const links = [
    { href: paths.about(locale), label: dict.nav.about },
    { href: paths.add(locale), label: dict.nav.add },
    { href: paths.map(locale), label: dict.nav.map },
    { href: GITHUB_URL, label: dict.footer.openSource },
  ];
  return (
    <footer className={`${PAGE} mt-20 pb-28 md:pb-12`}>
      <LanguageSwitcher locale={locale} label={dict.nav.language} align="left" direction="up" />
      <p className="text-muted mt-5 text-sm">
        © {dict.meta.siteName} · tsevedi.ge · {dict.footer.tagline}
      </p>
      <p className="text-subtle mt-1 text-sm">{dict.footer.disclaimer}</p>
      <nav className="text-muted mt-6 flex flex-wrap gap-x-5 gap-y-3 text-sm">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="hover:text-ink">
            {link.label}
          </Link>
        ))}
        <a href={`${GITHUB_URL}/blob/main/docs/API.md`} className="hover:text-ink">
          API
        </a>
      </nav>
    </footer>
  );
}
