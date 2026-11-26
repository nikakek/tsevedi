import { LogIn } from "lucide-react";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { paths } from "@/lib/paths";

/** Shown in place of a form that needs an account. */
export function SignInRequired({
  locale,
  dict,
  next,
}: {
  locale: Locale;
  dict: Dictionary;
  next: string;
}) {
  return (
    <div className="card p-8 text-center">
      <LogIn className="text-brand-600 mx-auto size-10" aria-hidden />
      <h2 className="mt-3 text-xl font-semibold tracking-tight">{dict.auth.requiredTitle}</h2>
      <p className="text-muted mx-auto mt-2 max-w-md">{dict.auth.requiredText}</p>
      <Link href={paths.signIn(locale, next)} className="btn btn-primary mt-6">
        {dict.nav.signIn}
      </Link>
    </div>
  );
}
