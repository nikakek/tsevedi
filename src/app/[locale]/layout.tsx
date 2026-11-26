import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SavedProvider } from "@/components/saved";
import { SiteHeader } from "@/components/site-header";
import { ThemeSync } from "@/components/theme";
import Script from "next/script";
import { themeScript } from "@/lib/theme-script";
import { isLocale, LOCALE_TAGS, LOCALES } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { SITE_URL } from "@/lib/paths";
import { fontVariables } from "../fonts";
import "../globals.css";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f4f5" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: dict.meta.title, template: `%s · ${dict.meta.siteName}` },
    description: dict.meta.description,
    applicationName: dict.meta.siteName,
    openGraph: { siteName: dict.meta.siteName, locale: LOCALE_TAGS[locale], type: "website" },
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(LOCALES.map((l) => [LOCALE_TAGS[l], `/${l}`])),
    },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return (
    <html
      lang={LOCALE_TAGS[locale]}
      className={`${fontVariables} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <Script
          id="theme"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
        <ThemeSync locale={locale} />
        <SavedProvider>
          <SiteHeader locale={locale} dict={dict} />
          <main className="flex-1">{children}</main>
          <SiteFooter locale={locale} dict={dict} />
        </SavedProvider>
      </body>
    </html>
  );
}
