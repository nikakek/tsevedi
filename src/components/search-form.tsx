"use client";

import { ArrowLeftRight, Search } from "lucide-react";
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
  compact?: boolean;
};

export function SearchForm({ locale, dict, places, initialFrom = null, initialTo = null, initialDate = null, compact }: Props) {
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

  return (
    <form onSubmit={submit} className={compact ? "card p-3" : "card p-4 shadow-sm sm:p-5"} noValidate>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr_10rem_auto] sm:items-end">
        <PlaceCombobox
          label={dict.from}
          placeholder={dict.fromPlaceholder}
          noMatches={dict.noMatches}
          places={places}
          locale={locale}
          value={from}
          onChange={setFrom}
          invalid={error && !from}
        />
        <button
          type="button"
          onClick={() => {
            setFrom(to);
            setTo(from);
          }}
          className="btn btn-secondary justify-self-center px-3 sm:mb-px"
          aria-label={dict.swap}
          title={dict.swap}
        >
          <ArrowLeftRight className="size-4 rotate-90 sm:rotate-0" aria-hidden />
        </button>
        <PlaceCombobox
          label={dict.to}
          placeholder={dict.toPlaceholder}
          noMatches={dict.noMatches}
          places={places}
          locale={locale}
          value={to}
          onChange={setTo}
          invalid={error && !to}
        />
        <div>
          <label htmlFor="search-date" className="mb-1 block text-sm font-medium">
            {dict.date}
          </label>
          <input
            id="search-date"
            type="date"
            className="field"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            aria-describedby="search-date-hint"
          />
          <span id="search-date-hint" className="sr-only">{dict.anyDay}</span>
        </div>
        <button type="submit" className="btn btn-primary h-[2.875rem]" disabled={!hydrated}>
          <Search className="size-4" aria-hidden />
          {dict.submit}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-brand-700">
          {dict.pickBoth}
        </p>
      )}
    </form>
  );
}
