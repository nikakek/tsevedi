import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/skeletons";
import { SubmitForm } from "@/components/submit-form";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { toComboPlaces } from "@/lib/combo-places";
import { paths } from "@/lib/paths";
import { getPlaces } from "@/server/queries";
import { submitListingAction } from "../actions";

type Props = PageProps<"/[locale]/add">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: dict.submit.title, description: dict.submit.intro, alternates: { canonical: paths.add(locale) } };
}

export default async function AddPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold">{dict.submit.title}</h1>
      <p className="mt-2 mb-6 text-muted">{dict.submit.intro}</p>
      <Suspense fallback={<PageSkeleton />}>
        <AddForm locale={locale} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function AddForm({ locale, searchParams }: { locale: "ka" | "en" | "ru"; searchParams: Props["searchParams"] }) {
  const [dict, places, query] = await Promise.all([getDictionary(locale), getPlaces(), searchParams]);
  const known = (slug: unknown) => (typeof slug === "string" && places.some((p) => p.slug === slug) ? slug : null);
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
