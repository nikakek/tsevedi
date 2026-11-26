import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { SignInButtons } from "@/components/sign-in-buttons";
import { PageSkeleton } from "@/components/skeletons";
import { isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { paths, safeNext } from "@/lib/paths";
import { PAGE } from "@/lib/ui";
import { enabledProviders, testAuthEnabled } from "@/server/auth";

type Props = PageProps<"/[locale]/signin">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: dict.auth.title, robots: { index: false } };
}

export default async function SignInPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <div className={`${PAGE} flex justify-center py-12`}>
      <div className="card w-full max-w-md p-8">
        <Suspense fallback={<PageSkeleton />}>
          <SignInContent locale={locale} searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function SignInContent({
  locale,
  searchParams,
}: {
  locale: Locale;
  searchParams: Props["searchParams"];
}) {
  const [dict, query] = await Promise.all([getDictionary(locale), searchParams]);
  const next = safeNext(query.next, paths.account(locale));
  const errorHref = `${paths.signIn(locale, next)}&error=1`;
  const [before, after] = dict.auth.agree.split("{privacy}");

  return (
    <>
      <Logo className="text-brand-600 size-12" />
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">{dict.auth.title}</h1>
      <p className="text-muted mt-2 mb-6">{dict.auth.subtitle}</p>
      {query.error && (
        <p role="alert" className="bg-brand-50 text-brand-800 mb-4 rounded-2xl p-3 text-sm">
          {dict.auth.error}
        </p>
      )}
      {enabledProviders.length === 0 && !testAuthEnabled ? (
        <p className="bg-warn-bg text-warn-fg rounded-2xl p-4 text-sm">{dict.auth.noProviders}</p>
      ) : (
        <SignInButtons
          providers={enabledProviders}
          next={next}
          errorHref={errorHref}
          testAuth={testAuthEnabled}
          labels={{
            google: dict.auth.google,
            facebook: dict.auth.facebook,
            error: dict.auth.error,
            testTitle: dict.auth.testTitle,
            email: dict.auth.email,
            password: dict.auth.password,
            name: dict.auth.name,
            testSubmit: dict.auth.testSubmit,
          }}
        />
      )}
      <p className="text-subtle mt-6 text-xs">
        {before}
        <Link href={paths.privacy(locale)} className="hover:text-ink underline">
          {dict.auth.privacyLink}
        </Link>
        {after}
      </p>
    </>
  );
}
