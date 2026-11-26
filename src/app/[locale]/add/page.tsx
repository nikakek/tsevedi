import { Check } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/skeletons";
import { SignInRequired } from "@/components/sign-in-required";
import { SubmitForm } from "@/components/submit-form";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { toComboPlaces } from "@/lib/combo-places";
import { paths } from "@/lib/paths";
import { PAGE } from "@/lib/ui";
import { getPlaces } from "@/server/queries";
import { getCurrentUser } from "@/server/session";
import { submitListingAction } from "../actions";

type Props = PageProps<"/[locale]/add">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return {
    title: dict.submit.title,
    description: dict.submit.intro,
    alternates: { canonical: paths.add(locale) },
  };
}

export default async function AddPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  return (
    <div
      className={`${PAGE} grid gap-8 py-8 lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[24rem_minmax(0,1fr)]`}
    >
      <div className="lg:sticky lg:top-28 lg:self-start">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{dict.submit.title}</h1>
        <p className="text-muted mt-3">{dict.submit.intro}</p>
        <ul className="mt-6 hidden space-y-3 text-sm lg:block">
          {dict.home.driversPoints.map((point) => (
            <li key={point} className="flex items-start gap-2.5">
              <Check className="text-ok-fg mt-0.5 size-4 shrink-0" aria-hidden />
              {point}
            </li>
          ))}
        </ul>
      </div>
      <Suspense fallback={<PageSkeleton />}>
        <AddForm locale={locale} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function AddForm({
  locale,
  searchParams,
}: {
  locale: "ka" | "en" | "ru";
  searchParams: Props["searchParams"];
}) {
  const [dict, places, query, user] = await Promise.all([
    getDictionary(locale),
    getPlaces(),
    searchParams,
    getCurrentUser(),
  ]);
  if (!user) return <SignInRequired locale={locale} dict={dict} next={paths.add(locale)} />;
  const known = (slug: unknown) =>
    typeof slug === "string" && places.some((p) => p.slug === slug) ? slug : null;
  return (
    <SubmitForm
      locale={locale}
      dict={dict}
      places={toComboPlaces(places)}
      action={submitListingAction}
      initialFrom={known(query.from)}
      initialTo={known(query.to)}
    />
  );
}
