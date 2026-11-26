"use client";

import { Bus, LogOut, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import type { Locale } from "@/i18n/config";
import { signOut, useSession } from "@/lib/auth-client";
import { paths } from "@/lib/paths";

type Labels = { signIn: string; account: string; driverArea: string; signOut: string };

function Avatar({ name, image }: { name: string; image?: string | null }) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- small remote avatar from Google/Facebook
      <img
        src={image}
        alt=""
        referrerPolicy="no-referrer"
        className="size-full rounded-full object-cover"
      />
    );
  }
  return <span className="text-sm font-semibold">{name.slice(0, 1).toUpperCase()}</span>;
}

/** "Sign in" pill when signed out; avatar with a small menu when signed in. */
export function AccountMenu({ locale, labels }: { locale: Locale; labels: Labels }) {
  const { data: session, isPending } = useSession();
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node))
        ref.current.removeAttribute("open");
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  if (isPending) return <span className="bg-canvas size-11 shrink-0 rounded-full" aria-hidden />;

  if (!session) {
    return (
      <Link href={paths.signIn(locale)} className="chip shrink-0 font-semibold">
        {labels.signIn}
      </Link>
    );
  }

  const { user } = session;
  return (
    <details ref={ref} className="relative">
      <summary
        aria-label={labels.account}
        className="border-line-strong bg-canvas flex size-11 cursor-pointer list-none items-center justify-center overflow-hidden rounded-full border [&::-webkit-details-marker]:hidden"
      >
        <Avatar name={user.name} image={user.image} />
      </summary>
      <div
        role="menu"
        className="border-line bg-surface shadow-float absolute right-0 z-50 mt-2 w-64 rounded-2xl border p-1.5"
      >
        <div className="px-3 py-2.5">
          <p className="truncate font-semibold">{user.name}</p>
          <p className="text-muted truncate text-sm">{user.email}</p>
        </div>
        <div className="bg-line my-1 h-px" />
        <Link
          href={paths.account(locale)}
          className="hover:bg-canvas flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium"
        >
          <User className="size-4" aria-hidden /> {labels.account}
        </Link>
        <Link
          href={paths.driver(locale)}
          className="hover:bg-canvas flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium"
        >
          <Bus className="size-4" aria-hidden /> {labels.driverArea}
        </Link>
        <button
          type="button"
          onClick={async () => {
            await signOut();
            window.location.assign(paths.home(locale));
          }}
          className="text-muted hover:bg-canvas hover:text-ink flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium"
        >
          <LogOut className="size-4" aria-hidden /> {labels.signOut}
        </button>
      </div>
    </details>
  );
}

/** Renders children for signed-in visitors, otherwise the fallback (usually a sign-in link). */
export function SignedIn({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback: React.ReactNode;
}) {
  const { data: session, isPending } = useSession();
  if (isPending) return null;
  return <>{session ? children : fallback}</>;
}
