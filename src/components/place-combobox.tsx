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
};

/** Accessible autocomplete (WAI-ARIA combobox pattern) over the places list. */
export function PlaceCombobox({ label, placeholder, noMatches, places, locale, value, onChange, name, invalid, hideLabel }: Props) {
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
      <label htmlFor={id} className={hideLabel ? "sr-only" : "mb-1 block text-sm font-medium"}>
        {label}
      </label>
      <div className="relative">
        <MapPin className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
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
          className="field pl-9"
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
          className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-line bg-surface py-1 shadow-lg"
        >
          {results.length === 0 && <li className="px-3 py-2 text-sm text-muted">{noMatches}</li>}
          {results.map((place, i) => (
            <li
              key={place.slug}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(place)}
              onMouseEnter={() => setActive(i)}
              className="flex cursor-pointer items-baseline justify-between gap-3 px-3 py-2 aria-selected:bg-brand-50"
            >
              <span className="font-medium">{placeName(place, locale)}</span>
              <span className="truncate text-xs text-muted">{regionName(place.region, locale)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
