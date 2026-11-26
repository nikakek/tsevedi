import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { SignInRequired } from "@/components/sign-in-required";
import { PageSkeleton } from "@/components/skeletons";
import { SubmitForm } from "@/components/submit-form";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { paths } from "@/lib/paths";
import { PAGE } from "@/lib/ui";
import { getDriverContext } from "@/server/driver-page";
import { registerDriverAction } from "../../actions";

type Props = PageProps<"/[locale]/driver/register">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: dict.driver.registerTitle, robots: { index: false } };
}

export default async function DriverRegisterPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  return (
    <div
      className={`${PAGE} grid gap-8 py-8 lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[24rem_minmax(0,1fr)]`}
    >
      <div className="lg:sticky lg:top-28 lg:self-start">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {dict.driver.registerTitle}
        </h1>
        <p className="text-muted mt-3">{dict.driver.registerIntro}</p>
      </div>
      <div className="max-w-3xl">
        <Suspense fallback={<PageSkeleton />}>
          <RegisterForm locale={locale} />
        </Suspense>
      </div>
    </div>
  );
}

async function RegisterForm({ locale }: { locale: Locale }) {
  const [dict, { user, driver }] = await Promise.all([getDictionary(locale), getDriverContext()]);
  if (!user)
    return <SignInRequired locale={locale} dict={dict} next={paths.driverRegister(locale)} />;
  if (driver) redirect(paths.driver(locale));
  return (
    <SubmitForm
      locale={locale}
      dict={dict}
      places={[]}
      action={registerDriverAction}
      mode="driver-register"
      submitLabel={dict.driver.submit}
      successHref={paths.driver(locale)}
    />
  );
}
