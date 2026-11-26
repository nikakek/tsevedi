"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { createContext, use, useCallback, useEffect, useState, useTransition } from "react";
import { getSavedAction, setSavedAction } from "@/app/[locale]/actions";
import { useSession } from "@/lib/auth-client";
import { useHydrated } from "@/lib/use-hydrated";

type SavedState = { drivers: Set<string>; listings: Set<string> };
type Ctx = {
  signedIn: boolean;
  /** False until the user's saved items have loaded; toggling earlier would be overwritten. */
  ready: boolean;
  isSaved: (type: "driver" | "listing", id: string) => boolean;
  toggle: (type: "driver" | "listing", id: string) => void;
};

const SavedContext = createContext<Ctx>({
  signedIn: false,
  ready: false,
  isSaved: () => false,
  toggle: () => {},
});

/**
 * Loads the signed-in user's saved drivers and trips once, on the client, so public pages stay
 * cached and identical for everyone; only the hearts are personal.
 */
export function SavedProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const userId = session?.user.id ?? null;
  const [saved, setSaved] = useState<SavedState>({ drivers: new Set(), listings: new Set() });
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    getSavedAction().then((ids) => {
      if (cancelled) return;
      if (ids) setSaved({ drivers: new Set(ids.drivers), listings: new Set(ids.listings) });
      setLoadedFor(userId);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const isSaved = useCallback(
    (type: "driver" | "listing", id: string) =>
      !!userId && (type === "driver" ? saved.drivers : saved.listings).has(id),
    [saved, userId],
  );

  const toggle = useCallback(
    (type: "driver" | "listing", id: string) => {
      const key = type === "driver" ? "drivers" : "listings";
      const next = !saved[key].has(id);
      // Optimistic update; roll back if the server says no.
      const apply = (on: boolean) =>
        setSaved((prev) => {
          const set = new Set(prev[key]);
          if (on) set.add(id);
          else set.delete(id);
          return { ...prev, [key]: set };
        });
      apply(next);
      setSavedAction(type, id, next).then((result) => !result.ok && apply(!next));
    },
    [saved],
  );

  const ready = !!userId && loadedFor === userId;
  return (
    <SavedContext value={{ signedIn: !!userId, ready, isSaved, toggle }}>{children}</SavedContext>
  );
}

/** Heart button. Signed-out visitors are sent to sign in and brought back afterwards. */
export function SaveButton({
  type,
  id,
  labels,
  signInHref,
  variant = "icon",
}: {
  type: "driver" | "listing";
  id: string;
  labels: { save: string; saved: string };
  signInHref: string;
  variant?: "icon" | "text";
}) {
  const { signedIn, ready, isSaved, toggle } = use(SavedContext);
  const hydrated = useHydrated();
  const [, startTransition] = useTransition();
  const saved = isSaved(type, id);
  const label = saved ? labels.saved : labels.save;
  const className =
    variant === "icon"
      ? "flex size-11 shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface hover:border-line-hover hover:bg-hover aria-pressed:border-brand-200 aria-pressed:bg-brand-50"
      : "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-medium text-muted hover:text-ink aria-pressed:text-brand-700";
  const icon = (
    <Heart className={`size-[18px] ${saved ? "fill-brand-600 text-brand-600" : ""}`} aria-hidden />
  );

  if (hydrated && !signedIn) {
    return (
      <Link href={signInHref} className={className} aria-label={labels.save} title={labels.save}>
        {icon}
        {variant === "text" && labels.save}
      </Link>
    );
  }
  return (
    <button
      type="button"
      className={className}
      aria-pressed={saved}
      aria-label={label}
      title={label}
      disabled={!hydrated || !ready}
      onClick={() => startTransition(() => toggle(type, id))}
    >
      {icon}
      {variant === "text" && label}
    </button>
  );
}
