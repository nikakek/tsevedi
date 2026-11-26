import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { paths } from "@/lib/paths";
import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "./logo";
import { HeaderNav, TabBar } from "./nav-links";
import { ThemeToggle } from "./theme";
import { AccountMenu } from "./account-menu";

export function SiteHeader({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const labels = {
    search: dict.nav.search,
    map: dict.nav.map,
    add: dict.nav.add,
    about: dict.nav.about,
    account: dict.nav.account,
    short: { map: dict.nav.mapShort, add: dict.nav.addShort, about: dict.nav.aboutShort },
  };
  return (
    <>
      <header className="relative z-40 pt-3 md:pt-4 lg:sticky lg:top-0">
        <div className="mx-auto w-full max-w-[120rem] px-3 md:px-8 xl:px-12">
          <div className="bg-surface/95 shadow-float ring-line flex h-16 items-center gap-2 rounded-full pr-2 pl-3 ring-1 backdrop-blur md:pl-4">
            <Link
              href={paths.home(locale)}
              className="mr-auto flex items-center gap-2.5 md:mr-0 md:flex-1"
            >
              <Logo className="text-brand-600 size-8" />
              <span className="text-lg font-semibold tracking-tight">{dict.meta.siteName}</span>
            </Link>
            <HeaderNav locale={locale} labels={labels} />
            <div className="flex items-center justify-end gap-2 md:flex-1">
              <ThemeToggle
                labels={{ toLight: dict.nav.themeToLight, toDark: dict.nav.themeToDark }}
              />
              <div className="hidden sm:block">
                <LanguageSwitcher locale={locale} label={dict.nav.language} />
              </div>
              <AccountMenu
                locale={locale}
                labels={{
                  signIn: dict.nav.signIn,
                  account: dict.nav.account,
                  driverArea: dict.nav.driverArea,
                  signOut: dict.nav.signOut,
                }}
              />
            </div>
          </div>
        </div>
      </header>
      <TabBar locale={locale} labels={labels} />
    </>
  );
}
