import Link from "next/link";
import { Logo } from "@/components/logo";

// not-found cannot read params, so this page is deliberately trilingual.
export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <Logo className="mx-auto size-12 text-brand-600" />
      <h1 className="mt-4 text-2xl font-bold">Page not found</h1>
      <p className="mt-1 text-muted" lang="ka">გვერდი ვერ მოიძებნა</p>
      <p className="text-muted" lang="ru">Страница не найдена</p>
      <Link href="/" className="btn btn-primary mt-6">
        Tsevedi
      </Link>
    </div>
  );
}
