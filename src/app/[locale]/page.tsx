import { ArrowRight, MessageCircle, Search, Wallet } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SearchForm } from "@/components/search-form";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { placeName } from "@/i18n/format";
import { toComboPlaces } from "@/lib/combo-places";
import { paths } from "@/lib/paths";
import { getPlaces, getRoutePairs, getStats } from "@/server/queries";

const HOW_ICONS = [Search, MessageCircle, Wallet];

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [dict, places, pairs, stats] = await Promise.all([
    getDictionary(locale),
    getPlaces(),
    getRoutePairs(),
    getStats(),
  ]);

  return (
    <>
      <section className="border-line from-brand-50 to-canvas border-b bg-gradient-to-b">
        <div className="mx-auto max-w-5xl px-4 pt-10 pb-8 sm:pt-16">
          <h1 className="max-w-2xl text-3xl font-bold tracking-tight text-balance sm:text-5xl">
            {dict.home.heroTitle}
          </h1>
          <p className="text-muted mt-4 max-w-2xl text-lg text-pretty">{dict.home.heroSubtitle}</p>
          <div className="mt-8">
            <SearchForm locale={locale} dict={dict.search} places={toComboPlaces(places)} />
          </div>
          {stats.routes > 0 && (
            <p className="text-muted mt-4 text-sm">
              <strong className="text-ink">{stats.routes}</strong> {dict.home.statsRoutes} ·{" "}
              <strong className="text-ink">{stats.places}</strong> {dict.home.statsPlaces}
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10">
        <h2 className="text-xl font-bold">{dict.home.popularTitle}</h2>
        {pairs.length === 0 ? (
          <p className="text-muted mt-3">
            {dict.home.popularEmpty}{" "}
            <Link href={paths.add(locale)} className="text-brand-700 font-medium hover:underline">
              {dict.nav.add} →
            </Link>
          </p>
        ) : (
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {pairs.slice(0, 12).map((pair) => (
              <li key={`${pair.from.slug}-${pair.to.slug}`}>
                <Link
                  href={paths.route(locale, pair.from.slug, pair.to.slug)}
                  className="card hover:border-brand-200 hover:bg-brand-50 flex items-center gap-2 px-4 py-3 font-medium"
                >
                  <span className="min-w-0">{placeName(pair.from, locale)}</span>
                  <ArrowRight className="text-muted size-4 shrink-0" aria-hidden />
                  <span className="min-w-0">{placeName(pair.to, locale)}</span>
                  {pair.minPrice !== null && (
                    <span className="text-muted ml-auto shrink-0 text-sm">{pair.minPrice}₾</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mx-auto max-w-5xl px-4 py-6">
        <h2 className="text-xl font-bold">{dict.home.howTitle}</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          {dict.home.how.map((step, i) => {
            const Icon = HOW_ICONS[i];
            return (
              <li key={step.title} className="card p-5">
                <div className="bg-brand-50 text-brand-700 mb-3 flex size-10 items-center justify-center rounded-xl">
                  <Icon className="size-5" aria-hidden />
                </div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-muted mt-1 text-sm">{step.text}</p>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="bg-ink flex flex-col gap-4 rounded-2xl p-6 text-white sm:flex-row sm:items-center sm:p-8">
          <div className="flex-1">
            <h2 className="text-xl font-bold">{dict.home.driversTitle}</h2>
            <p className="mt-2 text-white/75">{dict.home.driversText}</p>
          </div>
          <Link href={paths.add(locale)} className="btn btn-primary shrink-0">
            {dict.home.driversCta}
          </Link>
        </div>
      </section>
    </>
  );
}
