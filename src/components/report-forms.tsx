"use client";

import { CheckCircle2, Flag, MessageSquarePlus } from "lucide-react";
import { useState, useTransition } from "react";
import type { ActionState } from "@/app/[locale]/actions";
import type { Dictionary } from "@/i18n/dictionaries";
import { useHydrated } from "@/lib/use-hydrated";
import { PROBLEM_KINDS, RIDE_OUTCOMES } from "@/lib/validation";

type Action = (formData: FormData) => Promise<ActionState>;

function useAction(action: Action) {
  const [state, setState] = useState<ActionState>({ status: "idle" });
  const [pending, startTransition] = useTransition();
  const hydrated = useHydrated();
  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => setState(await action(formData)));
  }
  const error = (field: string) => (state.status === "error" ? state.errors[field] : undefined);
  return { state, pending: pending || !hydrated, onSubmit, error };
}

/** Invisible to people; bots that fill every field get silently ignored. */
function Honeypot() {
  return (
    <div aria-hidden className="absolute -left-[9999px]">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" />
    </div>
  );
}

function Success({ text }: { text: string }) {
  return (
    <p role="status" className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-emerald-800">
      <CheckCircle2 className="size-5" aria-hidden /> {text}
    </p>
  );
}

export function RideReportForm({ action, dict, validation, today }: { action: Action; dict: Dictionary["reports"]; validation: Dictionary["validation"]; today: string }) {
  const { state, pending, onSubmit, error } = useAction(action);
  const [open, setOpen] = useState(false);
  if (state.status === "success") return <Success text={dict.thanks} />;
  if (!open) {
    return (
      <button type="button" className="btn btn-secondary" onClick={() => setOpen(true)}>
        <MessageSquarePlus className="size-4" aria-hidden /> {dict.addTitle}
      </button>
    );
  }
  return (
    <form onSubmit={onSubmit} className="card relative space-y-4 p-4" noValidate>
      <Honeypot />
      <h3 className="font-semibold">{dict.addTitle}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          {dict.travelDate}
          <input type="date" name="travelDate" defaultValue={today} max={today} className="field mt-1" aria-invalid={!!error("travelDate")} required />
        </label>
        <label className="block text-sm font-medium">
          {dict.departedAt}
          <input type="time" name="departedAt" className="field mt-1" aria-invalid={!!error("departedAt")} />
        </label>
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">{dict.outcome}</legend>
        <div className="space-y-2">
          {RIDE_OUTCOMES.map((outcome) => (
            <label key={outcome} className="flex items-center gap-2 text-sm">
              <input type="radio" name="outcome" value={outcome} defaultChecked={outcome === "WORKED"} className="accent-brand-600" />
              {dict.outcomes[outcome]}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block text-sm font-medium">
        {dict.pricePaid}
        <input type="number" name="pricePaid" min={0} inputMode="numeric" className="field mt-1 max-w-40" aria-invalid={!!error("pricePaid")} />
      </label>
      <label className="block text-sm font-medium">
        {dict.comment}
        <textarea name="comment" rows={2} maxLength={500} className="field mt-1" />
      </label>
      {state.status === "error" && (
        <p role="alert" className="text-sm text-brand-700">
          {Object.values(state.errors).map((key) => validation[key]).join(" · ") || validation.required}
        </p>
      )}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {dict.submit}
      </button>
    </form>
  );
}

export function ProblemReportForm({ action, dict }: { action: Action; dict: Dictionary["reports"] }) {
  const { state, pending, onSubmit } = useAction(action);
  const [open, setOpen] = useState(false);
  if (state.status === "success") return <Success text={dict.problemThanks} />;
  if (!open) {
    return (
      <button type="button" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink" onClick={() => setOpen(true)}>
        <Flag className="size-4" aria-hidden /> {dict.problemTitle}
      </button>
    );
  }
  return (
    <form onSubmit={onSubmit} className="card relative space-y-4 p-4" noValidate>
      <Honeypot />
      <fieldset>
        <legend className="mb-2 font-semibold">{dict.problemKind}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {PROBLEM_KINDS.map((kind, i) => (
            <label key={kind} className="flex items-center gap-2 text-sm">
              <input type="radio" name="kind" value={kind} defaultChecked={i === 0} className="accent-brand-600" />
              {dict.problems[kind]}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block text-sm font-medium">
        {dict.problemMessage}
        <textarea name="message" rows={3} maxLength={1000} className="field mt-1" />
      </label>
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {dict.problemSubmit}
      </button>
    </form>
  );
}
