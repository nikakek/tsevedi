"use client";

import { useActionState } from "react";
import { Logo } from "@/components/logo";
import { loginAction } from "../actions";

export function LoginForm() {
  const [error, action, pending] = useActionState(loginAction, null);
  return (
    <form action={action} className="card w-full max-w-sm space-y-4 p-6">
      <div className="flex items-center gap-2 font-bold">
        <Logo className="size-7 text-brand-600" /> Tsevedi admin
      </div>
      <label className="block text-sm font-medium">
        Password
        <input type="password" name="password" required autoFocus autoComplete="current-password" className="field mt-1" />
      </label>
      {error && <p role="alert" className="text-sm text-brand-700">{error}</p>}
      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        Sign in
      </button>
    </form>
  );
}
