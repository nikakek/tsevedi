import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { paths } from "@/lib/paths";

type Props = PageProps<"/[locale]/about">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: dict.about.title, alternates: { canonical: paths.about(locale) } };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  return (
    <article className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{dict.about.title}</h1>
      <div className="mt-6 space-y-4 text-lg leading-relaxed">
        {dict.about.body.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <div className="mt-8 rounded-2xl bg-amber-50 p-5 text-amber-900">
        <h2 className="font-semibold">{dict.about.disclaimerTitle}</h2>
        <p className="mt-1">{dict.about.disclaimer}</p>
      </div>
      <h2 className="mt-8 text-xl font-semibold">{dict.about.contactTitle}</h2>
      <p className="text-muted mt-2">{dict.about.contact}</p>
      <Link href={paths.add(locale)} className="btn btn-primary mt-4">
        {dict.nav.add}
      </Link>
    </article>
  );
}
