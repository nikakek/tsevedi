"use client";

import { LogOut, Trash2 } from "lucide-react";
import { useState } from "react";
import { authClient, signOut } from "@/lib/auth-client";
import { useHydrated } from "@/lib/use-hydrated";

export function SignOutButton({ label, homeHref }: { label: string; homeHref: string }) {
  const hydrated = useHydrated();
  return (
    <button
      type="button"
      disabled={!hydrated}
      onClick={async () => {
        await signOut();
        window.location.assign(homeHref);
      }}
      className="btn btn-secondary w-full"
    >
      <LogOut className="size-4" aria-hidden /> {label}
    </button>
  );
}

export function DeleteAccountButton({
  labels,
  homeHref,
}: {
  labels: { button: string; confirm: string; error: string };
  homeHref: string;
}) {
  const hydrated = useHydrated();
  const [error, setError] = useState(false);
  return (
    <>
      <button
        type="button"
        disabled={!hydrated}
        onClick={async () => {
          if (!window.confirm(labels.confirm)) return;
          const result = await authClient.deleteUser();
          if (result.error) return setError(true);
          window.location.assign(homeHref);
        }}
        className="btn border-brand-200 text-brand-700 hover:bg-brand-50 w-full"
      >
        <Trash2 className="size-4" aria-hidden /> {labels.button}
      </button>
      {error && (
        <p role="alert" className="text-brand-700 mt-2 text-sm">
          {labels.error}
        </p>
      )}
    </>
  );
}

/** Small submit button that asks before submitting its form (e.g. removing a route). */
export function ConfirmSubmit({
  label,
  confirm,
  className,
}: {
  label: string;
  confirm: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(event) => {
        if (!window.confirm(confirm)) event.preventDefault();
      }}
    >
      {label}
    </button>
  );
}
