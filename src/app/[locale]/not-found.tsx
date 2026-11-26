import Link from "next/link";
import { Logo } from "@/components/logo";

// not-found cannot read params, so this page is deliberately trilingual.
export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <Logo className="text-brand-600 mx-auto size-12" />
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-muted mt-1" lang="ka">
        გვერდი ვერ მოიძებნა
      </p>
      <p className="text-muted" lang="ru">
        Страница не найдена
      </p>
      <Link href="/" className="btn btn-primary mt-6">
        Tsevedi
      </Link>
    </div>
  );
}
