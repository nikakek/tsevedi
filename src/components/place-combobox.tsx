"use client";

import { MapPin } from "lucide-react";
import { useId, useMemo, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { placeName } from "@/i18n/format";
import { buildPlaceIndex, searchPlaces } from "@/lib/place-search";
import { regionName } from "@/lib/regions";

export type ComboPlace = {
  slug: string;
  nameKa: string;
  nameEn: string;
  nameRu: string;
  aliases: string[];
  region: string;
};

type Props = {
  label: string;
  placeholder: string;
  noMatches: string;
  places: ComboPlace[];
  locale: Locale;
  value: string | null;
  onChange: (slug: string | null) => void;
  name?: string;
  invalid?: boolean;
  hideLabel?: boolean;
  /** "bare" drops the border so the input can sit inside a larger search bar. */
  variant?: "field" | "bare";
};

/** Accessible autocomplete (WAI-ARIA combobox pattern) over the places list. */
export function PlaceCombobox({
  label,
  placeholder,
  noMatches,
  places,
  locale,
  value,
  onChange,
  name,
  invalid,
  hideLabel,
  variant = "field",
}: Props) {
  const bare = variant === "bare";
  const id = useId();
  const listId = `${id}-list`;
  const index = useMemo(() => buildPlaceIndex(places), [places]);
  const selected = places.find((p) => p.slug === value) ?? null;
  const [query, setQuery] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const text = query ?? (selected ? placeName(selected, locale) : "");
  const results = useMemo(() => (query ? searchPlaces(index, query, 8) : []), [index, query]);

  function choose(place: ComboPlace) {
    onChange(place.slug);
    setQuery(null);
    setOpen(false);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" && open && results[active]) {
      event.preventDefault();
      choose(results[active]);
    } else if (event.key === "Escape") {
      setOpen(false);
      setQuery(null);
    }
  }

  const showList = open && query !== null && query.trim() !== "";

  return (
    <div className="relative">
      <label
        htmlFor={id}
        className={hideLabel || bare ? "sr-only" : "mb-1.5 block text-sm font-medium"}
      >
        {label}
      </label>
      <div className="relative">
        <MapPin
          className={`pointer-events-none absolute top-1/2 size-5 -translate-y-1/2 ${invalid ? "text-brand-600" : "text-subtle"} ${bare ? "left-4" : "left-3.5"}`}
          aria-hidden
        />
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && results[active] ? `${id}-opt-${active}` : undefined}
          aria-invalid={invalid || undefined}
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          className={
            bare
              ? "placeholder:text-subtle focus-visible:bg-canvas min-h-14 w-full rounded-full bg-transparent pr-14 pl-12 text-base outline-none md:pr-3 md:text-[17px]"
              : "field pl-11"
          }
          value={text}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
            setOpen(true);
            if (value) onChange(null);
          }}
          onFocus={(event) => event.target.select()}
          onBlur={() => {
            // Let a click on an option register before closing.
            setTimeout(() => {
              setOpen(false);
              if (query && results[0] && !value) choose(results[0]);
              else setQuery(null);
            }, 120);
          }}
          onKeyDown={onKeyDown}
        />
      </div>
      {name && <input type="hidden" name={name} value={value ?? ""} />}
      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className="border-line bg-surface shadow-float absolute z-30 mt-2 max-h-80 w-full min-w-64 overflow-auto rounded-2xl border p-1.5"
        >
          {results.length === 0 && <li className="text-muted px-3 py-2.5 text-sm">{noMatches}</li>}
          {results.map((place, i) => (
            <li
              key={place.slug}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(place)}
              onMouseEnter={() => setActive(i)}
              className="aria-selected:bg-canvas flex cursor-pointer items-baseline justify-between gap-3 rounded-xl px-3 py-2.5"
            >
              <span className="font-medium">{placeName(place, locale)}</span>
              <span className="text-muted truncate text-xs">
                {regionName(place.region, locale)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
