import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { paths } from "@/lib/paths";
import { PAGE } from "@/lib/ui";

type Props = PageProps<"/[locale]/privacy">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = await getDictionary(locale);
  return { title: dict.privacy.title, alternates: { canonical: paths.privacy(locale) } };
}

/** Required by Google and Facebook sign-in: what we store and how to delete it. */
export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);
  return (
    <article className={`${PAGE} py-10`}>
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">{dict.privacy.title}</h1>
        <div className="text-muted mt-8 space-y-5 text-lg leading-relaxed">
          {dict.privacy.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <h2 id="deletion" className="mt-10 text-2xl font-semibold tracking-tight">
          {dict.privacy.deletionTitle}
        </h2>
        <p className="text-muted mt-3 text-lg leading-relaxed">{dict.privacy.deletion}</p>
      </div>
    </article>
  );
}
