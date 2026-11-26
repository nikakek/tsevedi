import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DriverRouteEditor } from "@/components/driver-route-page";
import { PageSkeleton } from "@/components/skeletons";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { PAGE } from "@/lib/ui";

type Props = PageProps<"/[locale]/driver/routes/[id]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: dict.driver.editRoute, robots: { index: false } };
}

export default function Page({ params }: Props) {
  return (
    <div className={`${PAGE} py-8`}>
      <Suspense fallback={<PageSkeleton />}>
        {params.then((p) =>
          isLocale(p.locale) ? (
            <DriverRouteEditor locale={p.locale} listingId={p.id} />
          ) : (
            notFound()
          ),
        )}
      </Suspense>
    </div>
  );
}
