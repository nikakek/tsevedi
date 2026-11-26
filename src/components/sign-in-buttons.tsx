"use client";

import { useState, useTransition } from "react";
import { authClient, signIn } from "@/lib/auth-client";
import { useHydrated } from "@/lib/use-hydrated";

type Labels = {
  google: string;
  facebook: string;
  error: string;
  testTitle: string;
  email: string;
  password: string;
  name: string;
  testSubmit: string;
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z"
      />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.8 3.6-4.9 6.7-4.9Z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        fill="#1877F2"
        d="M24 12a12 12 0 1 0-13.9 11.9v-8.4h-3V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12Z"
      />
    </svg>
  );
}

export function SignInButtons({
  providers,
  next,
  errorHref,
  testAuth,
  labels,
}: {
  providers: Array<"google" | "facebook">;
  next: string;
  errorHref: string;
  testAuth: boolean;
  labels: Labels;
}) {
  const hydrated = useHydrated();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);

  function social(provider: "google" | "facebook") {
    startTransition(async () => {
      // Redirects to Google/Facebook, then back to `next`.
      const result = await signIn.social({
        provider,
        callbackURL: next,
        errorCallbackURL: errorHref,
      });
      if (result.error) setError(true);
    });
  }

  function testSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const name = String(form.get("name") || email.split("@")[0]);
    startTransition(async () => {
      const signedIn = await authClient.signIn.email({ email, password });
      if (signedIn.error) {
        const signedUp = await authClient.signUp.email({ email, password, name });
        if (signedUp.error) return setError(true);
      }
      window.location.assign(next);
    });
  }

  return (
    <div className="space-y-3">
      {providers.includes("google") && (
        <button
          type="button"
          onClick={() => social("google")}
          disabled={!hydrated || pending}
          className="btn btn-secondary min-h-12 w-full text-base"
        >
          <GoogleIcon /> {labels.google}
        </button>
      )}
      {providers.includes("facebook") && (
        <button
          type="button"
          onClick={() => social("facebook")}
          disabled={!hydrated || pending}
          className="btn btn-secondary min-h-12 w-full text-base"
        >
          <FacebookIcon /> {labels.facebook}
        </button>
      )}
      {error && (
        <p role="alert" className="text-brand-700 text-sm">
          {labels.error}
        </p>
      )}
      {testAuth && (
        <form
          onSubmit={testSignIn}
          className="border-line-strong space-y-3 rounded-2xl border border-dashed p-4"
        >
          <p className="text-muted text-sm font-medium">{labels.testTitle}</p>
          <input name="name" placeholder={labels.name} aria-label={labels.name} className="field" />
          <input
            name="email"
            type="email"
            required
            placeholder={labels.email}
            aria-label={labels.email}
            className="field"
          />
          <input
            name="password"
            type="password"
            required
            minLength={8}
            placeholder={labels.password}
            aria-label={labels.password}
            className="field"
          />
          <button type="submit" className="btn btn-primary w-full" disabled={!hydrated || pending}>
            {labels.testSubmit}
          </button>
        </form>
      )}
    </div>
  );
}
