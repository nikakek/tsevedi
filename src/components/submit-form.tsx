"use client";

import { CheckCircle2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import type { ActionState } from "@/app/[locale]/actions";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { paths } from "@/lib/paths";
import { ALL_DAYS, weekdayName } from "@/lib/schedule";
import { LANGUAGES, VEHICLE_TYPES } from "@/lib/validation";
import { PlaceCombobox, type ComboPlace } from "./place-combobox";

type Props = {
  locale: Locale;
  dict: Dictionary;
  places: ComboPlace[];
  action: (formData: FormData) => Promise<ActionState>;
  initialFrom?: string | null;
  initialTo?: string | null;
};

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="card space-y-4 p-4 sm:p-5">
      <legend className="sr-only">{title}</legend>
      <div>
        <h2 className="text-lg font-semibold" aria-hidden>
          {title}
        </h2>
        {hint && <p className="text-sm text-muted">{hint}</p>}
      </div>
      {children}
    </fieldset>
  );
}

export function SubmitForm({ locale, dict, places, action, initialFrom = null, initialTo = null }: Props) {
  const s = dict.submit;
  const [state, setState] = useState<ActionState>({ status: "idle" });
  const [pending, startTransition] = useTransition();
  const [origin, setOrigin] = useState<string | null>(initialFrom);
  const [destination, setDestination] = useState<string | null>(initialTo);
  const [via, setVia] = useState<Array<{ key: number; slug: string | null }>>([]);
  const [returns, setReturns] = useState(false);
  const [allYear, setAllYear] = useState(true);
  const [formKey, setFormKey] = useState(0);

  const errors = state.status === "error" ? state.errors : {};
  const err = (field: string) => errors[field];
  const message = (field: string) =>
    err(field) ? (
      <p className="mt-1 text-sm text-brand-700" id={`${field}-error`}>
        {dict.validation[err(field)]}
      </p>
    ) : null;
  const invalid = (field: string) => ({
    "aria-invalid": err(field) ? true : undefined,
    "aria-describedby": err(field) ? `${field}-error` : undefined,
  });

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await action(formData);
      setState(result);
      if (result.status !== "success") {
        document.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  if (state.status === "success") {
    return (
      <div className="card p-8 text-center" role="status">
        <CheckCircle2 className="mx-auto size-12 text-emerald-600" aria-hidden />
        <h2 className="mt-3 text-xl font-bold">{s.successTitle}</h2>
        <p className="mx-auto mt-2 max-w-md text-muted">{s.successText}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setState({ status: "idle" });
              setOrigin(null);
              setDestination(null);
              setVia([]);
              setFormKey((k) => k + 1);
            }}
          >
            {s.addAnother}
          </button>
          <Link href={paths.home(locale)} className="btn btn-secondary">
            {dict.common.backHome}
          </Link>
        </div>
      </div>
    );
  }

  const stops = [origin, ...via.map((v) => v.slug), destination];

  return (
    <form key={formKey} onSubmit={onSubmit} className="relative space-y-5" noValidate>
      <div aria-hidden className="absolute -left-[9999px]">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {stops.map((slug, i) => (
        <input key={i} type="hidden" name="stops" value={slug ?? ""} />
      ))}

      <Section title={s.whoTitle}>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2">
            <input type="radio" name="who" value="driver" defaultChecked className="accent-brand-600" /> {s.whoDriver}
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="who" value="other" className="accent-brand-600" /> {s.whoOther}
          </label>
        </div>
      </Section>

      <Section title={s.routeTitle} hint={s.routeHint}>
        <PlaceCombobox
          label={s.origin}
          placeholder={dict.search.fromPlaceholder}
          noMatches={dict.search.noMatches}
          places={places}
          locale={locale}
          value={origin}
          onChange={setOrigin}
          invalid={!!err("stops") && !origin}
        />
        {via.map((stop, i) => (
          <div key={stop.key} className="flex items-end gap-2 pl-4">
            <div className="flex-1">
              <PlaceCombobox
                label={`${s.stop} ${i + 1}`}
                placeholder={dict.search.toPlaceholder}
                noMatches={dict.search.noMatches}
                places={places}
                locale={locale}
                value={stop.slug}
                onChange={(slug) => setVia((list) => list.map((v) => (v.key === stop.key ? { ...v, slug } : v)))}
              />
            </div>
            <button
              type="button"
              className="btn btn-secondary px-3"
              onClick={() => setVia((list) => list.filter((v) => v.key !== stop.key))}
              aria-label={s.removeStop}
              title={s.removeStop}
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="ml-4 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
          onClick={() => setVia((list) => [...list, { key: Date.now(), slug: null }])}
        >
          <Plus className="size-4" aria-hidden /> {s.addStop}
        </button>
        <PlaceCombobox
          label={s.destination}
          placeholder={dict.search.toPlaceholder}
          noMatches={dict.search.noMatches}
          places={places}
          locale={locale}
          value={destination}
          onChange={setDestination}
          invalid={!!err("stops") && !destination}
        />
        {message("stops")}
      </Section>

      <Section title={s.scheduleTitle}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            {s.departureTime}
            <input type="time" name="departureTime" required className="field mt-1" {...invalid("departureTime")} />
            {message("departureTime")}
          </label>
        </div>
        <label className="block text-sm font-medium">
          {s.departurePoint}
          <input
            type="text"
            name="departurePoint"
            required
            maxLength={200}
            placeholder={s.departurePointPlaceholder}
            className="field mt-1"
            {...invalid("departurePoint")}
          />
          {message("departurePoint")}
        </label>
        <label className="block text-sm font-medium">
          {s.mapsUrl}
          <input type="url" name="departureMapsUrl" inputMode="url" placeholder="https://maps.app.goo.gl/…" className="field mt-1" {...invalid("departureMapsUrl")} />
          {message("departureMapsUrl")}
        </label>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">{s.days}</legend>
          <div className="flex flex-wrap gap-2">
            {ALL_DAYS.map((day) => (
              <label key={day} className="cursor-pointer">
                <input type="checkbox" name="days" value={day} defaultChecked className="peer sr-only" />
                <span className="block rounded-lg border border-line px-3 py-1.5 text-sm peer-checked:border-brand-600 peer-checked:bg-brand-50 peer-checked:text-brand-800 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-600">
                  {weekdayName(day, locale, "short")}
                </span>
              </label>
            ))}
          </div>
          {message("days")}
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">{s.months}</legend>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={allYear} onChange={(e) => setAllYear(e.target.checked)} className="accent-brand-600" />
            {s.allYear}
          </label>
          {!allYear && (
            <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6">
              {MONTHS.map((month) => (
                <label key={month} className="cursor-pointer">
                  <input type="checkbox" name="activeMonths" value={month} className="peer sr-only" />
                  <span className="block rounded-lg border border-line px-2 py-1.5 text-center text-sm peer-checked:border-brand-600 peer-checked:bg-brand-50 peer-checked:text-brand-800 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-600">
                    {new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2024, month - 1, 1)))}
                  </span>
                </label>
              ))}
            </div>
          )}
        </fieldset>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="returns" checked={returns} onChange={(e) => setReturns(e.target.checked)} className="accent-brand-600" />
          {s.returns}
        </label>
        {returns && (
          <div className="grid gap-4 border-l-2 border-brand-200 pl-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              {s.returnTime}
              <input type="time" name="returnTime" className="field mt-1" {...invalid("returnTime")} />
              {message("returnTime")}
            </label>
            <label className="block text-sm font-medium">
              {s.returnPoint}
              <input type="text" name="returnPoint" maxLength={200} className="field mt-1" />
            </label>
          </div>
        )}
      </Section>

      <Section title={s.priceTitle}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            {s.pricePerSeat}
            <input type="number" name="pricePerSeat" min={0} inputMode="numeric" className="field mt-1" {...invalid("pricePerSeat")} />
            {message("pricePerSeat")}
          </label>
          <label className="block text-sm font-medium">
            {s.priceWholeVehicle}
            <input type="number" name="priceWholeVehicle" min={0} inputMode="numeric" className="field mt-1" {...invalid("priceWholeVehicle")} />
            {message("priceWholeVehicle")}
          </label>
        </div>
      </Section>

      <Section title={s.driverTitle}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            {s.driverName}
            <input type="text" name="driverName" required maxLength={80} autoComplete="name" className="field mt-1" {...invalid("driverName")} />
            {message("driverName")}
          </label>
          <label className="block text-sm font-medium">
            {s.phone}
            <input type="tel" name="phone" required inputMode="tel" autoComplete="tel" placeholder="555 12 34 56" className="field mt-1" {...invalid("phone")} />
            {message("phone") ?? <p className="mt-1 text-xs text-muted">{s.phoneHint}</p>}
          </label>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">{s.messengers}</legend>
          <div className="flex flex-wrap gap-4">
            {(["whatsapp", "viber", "telegram"] as const).map((app) => (
              <label key={app} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name={app} className="accent-brand-600" /> {dict.listing[app]}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">{s.languages}</legend>
          <div className="flex flex-wrap gap-4">
            {LANGUAGES.map((lang) => (
              <label key={lang} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="languages" value={lang} defaultChecked={lang === "KA"} className="accent-brand-600" />
                {dict.language[lang]}
              </label>
            ))}
          </div>
        </fieldset>
      </Section>

      <Section title={s.vehicleTitle}>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">{s.vehicleType}</legend>
          <div className="flex flex-wrap gap-2">
            {VEHICLE_TYPES.map((type) => (
              <label key={type} className="cursor-pointer">
                <input type="radio" name="vehicleType" value={type} defaultChecked={type === "MARSHRUTKA"} className="peer sr-only" />
                <span className="block rounded-lg border border-line px-3 py-1.5 text-sm peer-checked:border-brand-600 peer-checked:bg-brand-50 peer-checked:text-brand-800 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-600">
                  {dict.vehicle[type]}
                </span>
              </label>
            ))}
          </div>
          {message("vehicleType")}
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            {s.vehicleModel}
            <input type="text" name="vehicleModel" maxLength={60} placeholder={s.vehicleModelPlaceholder} className="field mt-1" />
          </label>
          <label className="block text-sm font-medium">
            {s.vehicleColor}
            <input type="text" name="vehicleColor" maxLength={30} placeholder={s.vehicleColorPlaceholder} className="field mt-1" />
          </label>
          <label className="block text-sm font-medium">
            {s.plate}
            <input type="text" name="plate" maxLength={15} placeholder="AA-123-BB" className="field mt-1 uppercase" />
          </label>
          <label className="block text-sm font-medium">
            {s.seats}
            <input type="number" name="seats" min={1} max={70} inputMode="numeric" className="field mt-1" {...invalid("seats")} />
            {message("seats")}
          </label>
        </div>
      </Section>

      <Section title={s.extraTitle}>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="callAhead" defaultChecked className="accent-brand-600" /> {s.callAhead}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="largeLuggage" className="accent-brand-600" /> {s.largeLuggage}
        </label>
        <label className="block text-sm font-medium">
          {s.notes}
          <textarea name="notes" rows={3} maxLength={1000} className="field mt-1" />
        </label>
      </Section>

      <Section title={s.contactTitle}>
        <label className="block text-sm font-medium">
          {s.contact}
          <input type="text" name="submitterContact" maxLength={200} className="field mt-1" />
        </label>
      </Section>

      {state.status === "error" && (
        <p role="alert" className="rounded-xl bg-brand-50 p-4 text-sm text-brand-800">
          {state.reason === "rate-limited" ? s.errorTooMany : s.errorGeneric}
        </p>
      )}
      <button type="submit" className="btn btn-primary w-full py-3 text-base sm:w-auto" disabled={pending}>
        {pending ? dict.common.loading : s.submit}
      </button>
    </form>
  );
}
