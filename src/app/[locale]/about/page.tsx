import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { paths } from "@/lib/paths";
import { PAGE } from "@/lib/ui";

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
    <div
      className={`${PAGE} grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_28rem]`}
    >
      <article className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">{dict.about.title}</h1>
        <div className="text-muted mt-8 space-y-5 text-lg leading-relaxed">
          {dict.about.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </article>
      <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
        <div className="bg-warn-bg text-warn-fg rounded-[1.75rem] p-6">
          <h2 className="font-semibold">{dict.about.disclaimerTitle}</h2>
          <p className="mt-1">{dict.about.disclaimer}</p>
        </div>
        <div className="card p-6">
          <h2 className="text-xl font-semibold tracking-tight">{dict.about.contactTitle}</h2>
          <p className="text-muted mt-2">{dict.about.contact}</p>
          <Link href={paths.add(locale)} className="btn btn-primary mt-5 w-full">
            {dict.nav.add}
          </Link>
        </div>
      </aside>
    </div>
  );
}
