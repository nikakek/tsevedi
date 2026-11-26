"use client";

import { useState, useTransition } from "react";
import { LANGUAGES, VEHICLE_TYPES } from "@/lib/validation";
import type { EditState } from "../../actions";

type Values = Record<string, string | boolean | string[]>;

export function EditForm({ action, values }: { action: (state: EditState, formData: FormData) => Promise<EditState>; values: Values }) {
  const [state, setState] = useState<EditState>(null);
  const [pending, startTransition] = useTransition();
  const error = (name: string) => state?.errors[name];

  const text = (name: string, label: string, hint?: string) => (
    <label className="block text-sm font-medium">
      {label}
      <input name={name} defaultValue={values[name] as string} className="field mt-1" aria-invalid={!!error(name)} />
      {hint && <span className="mt-1 block text-xs font-normal text-muted">{hint}</span>}
      {error(name) && <span className="mt-1 block text-xs text-brand-700">{error(name)}</span>}
    </label>
  );
  const box = (name: string, label: string) => (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={values[name] as boolean} className="accent-brand-600" /> {label}
    </label>
  );

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => setState(await action(state, formData)));
      }}
      className="card space-y-5 p-5"
    >
      <h2 className="font-semibold">Route & schedule</h2>
      {text("stops", "Stops (place slugs, in order)", "e.g. tbilisi, kutaisi, ambrolauri, oni")}
      <div className="grid gap-4 sm:grid-cols-3">
        {text("departureTime", "Departure time")}
        {text("days", "Days (1=Mon … 7=Sun)", "e.g. 1,2,3,4,5,6,7")}
        {text("activeMonths", "Months (empty = all year)", "e.g. 6,7,8,9")}
      </div>
      {text("departurePoint", "Departure point")}
      {text("departureMapsUrl", "Google Maps link")}
      <div className="grid gap-4 sm:grid-cols-2">
        {text("returnTime", "Return time (empty = one way)")}
        {text("returnPoint", "Return point")}
        {text("pricePerSeat", "Price per seat (₾)")}
        {text("priceWholeVehicle", "Whole vehicle (₾)")}
      </div>
      <div className="flex flex-wrap gap-4">
        {box("callAhead", "Call ahead")}
        <label className="flex items-center gap-2 text-sm">
          Large luggage
          <select name="largeLuggage" defaultValue={values.largeLuggage as string} className="field w-auto py-1">
            <option value="">Unknown</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>
      </div>
      <label className="block text-sm font-medium">
        Public notes
        <textarea name="notes" defaultValue={values.notes as string} rows={3} className="field mt-1" />
      </label>

      <h2 className="border-t border-line pt-5 font-semibold">Driver & vehicle</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {text("driverName", "Name")}
        {text("phone", "Phone")}
      </div>
      <div className="flex flex-wrap gap-4">
        {box("whatsapp", "WhatsApp")}
        {box("viber", "Viber")}
        {box("telegram", "Telegram")}
      </div>
      <div className="flex flex-wrap gap-4">
        {LANGUAGES.map((lang) => (
          <label key={lang} className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="languages" value={lang} defaultChecked={(values.languages as string[]).includes(lang)} className="accent-brand-600" />
            {lang}
          </label>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Vehicle type
          <select name="vehicleType" defaultValue={values.vehicleType as string} className="field mt-1">
            {VEHICLE_TYPES.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        {text("vehicleModel", "Model")}
        {text("vehicleColor", "Colour")}
        {text("plate", "Plate")}
        {text("seats", "Seats")}
      </div>

      <h2 className="border-t border-line pt-5 font-semibold">Internal</h2>
      <label className="block text-sm font-medium">
        Admin note (never shown publicly)
        <textarea name="adminNote" defaultValue={values.adminNote as string} rows={2} className="field mt-1" />
      </label>

      {state && !state.ok && <p role="alert" className="text-sm text-brand-700">Fix: {Object.entries(state.errors).map(([k, v]) => `${k} (${v})`).join(", ")}</p>}
      {state?.ok && <p role="status" className="text-sm text-emerald-700">Saved.</p>}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
