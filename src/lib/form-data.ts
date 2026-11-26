/** Small helpers for turning FormData into plain values for zod. */
export const checked = (formData: FormData, name: string) => formData.get(name) === "on";

export const value = (formData: FormData, name: string) => {
  const v = formData.get(name);
  return typeof v === "string" ? v : undefined;
};

export function driverInput(formData: FormData) {
  return {
    driverName: value(formData, "driverName"),
    phone: value(formData, "phone"),
    whatsapp: checked(formData, "whatsapp"),
    viber: checked(formData, "viber"),
    telegram: checked(formData, "telegram"),
    languages: formData.getAll("languages"),
    vehicleType: value(formData, "vehicleType"),
    vehicleModel: value(formData, "vehicleModel"),
    vehicleColor: value(formData, "vehicleColor"),
    plate: value(formData, "plate"),
    seats: value(formData, "seats"),
  };
}

export function routeInput(formData: FormData) {
  const returns = checked(formData, "returns");
  return {
    stops: formData.getAll("stops").filter((s) => typeof s === "string" && s !== ""),
    departureTime: value(formData, "departureTime"),
    days: formData.getAll("days"),
    activeMonths: formData.getAll("activeMonths"),
    departurePoint: value(formData, "departurePoint"),
    departureMapsUrl: value(formData, "departureMapsUrl"),
    returnTime: returns ? value(formData, "returnTime") : undefined,
    returnPoint: returns ? value(formData, "returnPoint") : undefined,
    pricePerSeat: value(formData, "pricePerSeat"),
    priceWholeVehicle: value(formData, "priceWholeVehicle"),
    largeLuggage: checked(formData, "largeLuggage") || undefined,
    callAhead: checked(formData, "callAhead"),
    notes: value(formData, "notes"),
  };
}
