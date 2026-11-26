"use client";

import { ArrowUpDown, CalendarDays, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { paths } from "@/lib/paths";
import { useHydrated } from "@/lib/use-hydrated";
import { PlaceCombobox, type ComboPlace } from "./place-combobox";

type Props = {
  locale: Locale;
  dict: Dictionary["search"];
  places: ComboPlace[];
  initialFrom?: string | null;
  initialTo?: string | null;
  initialDate?: string | null;
};

/**
 * One rounded search bar on desktop. On phones the two places stack in a card and
 * the date and search button sit underneath as pills.
 */
export function SearchForm({
  locale,
  dict,
  places,
  initialFrom = null,
  initialTo = null,
  initialDate = null,
}: Props) {
  const router = useRouter();
  const [from, setFrom] = useState<string | null>(initialFrom);
  const [to, setTo] = useState<string | null>(initialTo);
  const [date, setDate] = useState(initialDate ?? "");
  const [error, setError] = useState(false);
  const hydrated = useHydrated();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!from || !to || from === to) {
      setError(true);
      return;
    }
    setError(false);
    router.push(paths.route(locale, from, to, date || null));
  }

  const combo = { noMatches: dict.noMatches, places, locale, variant: "bare" as const };

  return (
    <form onSubmit={submit} noValidate>
      <div className="md:bg-surface md:shadow-float md:ring-line md:flex md:items-center md:gap-1 md:rounded-full md:p-1.5 md:ring-1">
        <div className="bg-surface shadow-float ring-line relative flex flex-col rounded-[1.75rem] ring-1 md:flex-1 md:flex-row md:items-center md:rounded-none md:bg-transparent md:shadow-none md:ring-0">
          <div className="md:flex-1">
            <PlaceCombobox
              {...combo}
              label={dict.from}
              placeholder={dict.from}
              value={from}
              onChange={setFrom}
              invalid={error && !from}
            />
          </div>
          <div className="bg-line mx-4 h-px md:mx-0 md:hidden" aria-hidden />
          <button
            type="button"
            onClick={() => {
              setFrom(to);
              setTo(from);
            }}
            className="border-line-strong bg-surface text-muted hover:text-ink absolute top-1/2 right-3 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border md:static md:size-9 md:translate-y-0 md:rotate-90"
            aria-label={dict.swap}
            title={dict.swap}
          >
            <ArrowUpDown className="size-4" aria-hidden />
          </button>
          <div className="md:flex-1">
            <PlaceCombobox
              {...combo}
              label={dict.to}
              placeholder={dict.to}
              value={to}
              onChange={setTo}
              invalid={error && !to}
            />
          </div>
        </div>
        <div className="mt-2 flex gap-2 md:mt-0 md:gap-1.5">
          <label className="bg-surface ring-line-strong md:before:bg-line relative flex min-h-12 flex-1 items-center rounded-full ring-1 md:w-44 md:flex-none md:ring-0 md:before:absolute md:before:inset-y-2 md:before:left-0 md:before:w-px">
            <span className="sr-only">{dict.date}</span>
            <CalendarDays
              className="text-subtle pointer-events-none absolute left-4 size-5"
              aria-hidden
            />
            <input
              type="date"
              className="focus-visible:bg-canvas min-h-12 w-full rounded-full bg-transparent pr-3 pl-12 text-[15px] outline-none"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              aria-label={dict.date}
              title={dict.anyDay}
            />
          </label>
          <button
            type="submit"
            className="btn btn-primary min-h-12 flex-1 px-7 text-base md:flex-none"
            disabled={!hydrated}
          >
            <Search className="size-4" aria-hidden />
            {dict.submit}
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="text-brand-700 mt-3 px-2 text-sm">
          {dict.pickBoth}
        </p>
      )}
    </form>
  );
}
