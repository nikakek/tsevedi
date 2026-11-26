/**
 * Input schemas shared by the web forms (server actions) and the public JSON API.
 * Error messages are keys into the `validation` dictionary so each client can translate them.
 */
import { z } from "zod";
import { normalizePhone } from "./phone";
import { isIsoDate } from "./schedule";

export const LANGUAGES = ["KA", "RU", "EN", "TR", "HY", "AZ"] as const;
export const VEHICLE_TYPES = ["MARSHRUTKA", "MINIVAN", "SEDAN", "SUV", "BUS"] as const;
export const RIDE_OUTCOMES = ["WORKED", "DIFFERENT", "DID_NOT_RUN"] as const;
export const PROBLEM_KINDS = ["WRONG_TIME", "WRONG_PRICE", "NOT_RUNNING", "WRONG_PHONE", "OTHER"] as const;

export type ValidationKey =
  | "required"
  | "phone"
  | "time"
  | "url"
  | "stops"
  | "duplicateStops"
  | "days"
  | "number"
  | "tooLong";

const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const text = (max: number) =>
  z.string({ error: "required" }).trim().min(1, { error: "required" }).max(max, { error: "tooLong" });

const optionalText = (max: number) =>
  z.preprocess(blankToUndefined, z.string().trim().max(max, { error: "tooLong" }).optional());

const time = z.string({ error: "required" }).regex(/^([01]?\d|2[0-3]):[0-5]\d$/, { error: "time" });
const optionalTime = z.preprocess(blankToUndefined, time.optional());

const optionalInt = (min: number, max: number) =>
  z.preprocess(
    blankToUndefined,
    z.coerce.number({ error: "number" }).int({ error: "number" }).min(min, { error: "number" }).max(max, { error: "number" }).optional(),
  );

export const listingSubmissionSchema = z
  .object({
    submittedByDriver: z.boolean().default(false),
    driverName: text(80),
    phone: z
      .string({ error: "required" })
      .transform((value, ctx) => {
        const phone = normalizePhone(value);
        if (!phone) {
          ctx.addIssue({ code: "custom", message: "phone" });
          return z.NEVER;
        }
        return phone;
      }),
    whatsapp: z.boolean().default(false),
    viber: z.boolean().default(false),
    telegram: z.boolean().default(false),
    languages: z.array(z.enum(LANGUAGES)).default([]),
    vehicleType: z.enum(VEHICLE_TYPES, { error: "required" }),
    vehicleModel: optionalText(60),
    vehicleColor: optionalText(30),
    plate: optionalText(15),
    seats: optionalInt(1, 70),
    stops: z
      .array(z.string().trim().min(1))
      .min(2, { error: "stops" })
      .max(12, { error: "tooLong" })
      .refine((stops) => new Set(stops).size === stops.length, { error: "duplicateStops" }),
    departureTime: time,
    days: z.array(z.coerce.number().int().min(1).max(7)).min(1, { error: "days" }),
    activeMonths: z.array(z.coerce.number().int().min(1).max(12)).default([]),
    departurePoint: text(200),
    departureMapsUrl: z.preprocess(
      blankToUndefined,
      z.url({ error: "url", protocol: /^https?$/ }).max(500, { error: "tooLong" }).optional(),
    ),
    returnTime: optionalTime,
    returnPoint: optionalText(200),
    pricePerSeat: optionalInt(0, 5000),
    priceWholeVehicle: optionalInt(0, 20000),
    largeLuggage: z.boolean().optional(),
    callAhead: z.boolean().default(true),
    notes: optionalText(1000),
    submitterContact: optionalText(200),
  })
  .transform((data) => ({
    ...data,
    // A return point without a return time means nothing.
    returnPoint: data.returnTime ? data.returnPoint : undefined,
    days: [...new Set(data.days)].sort((a, b) => a - b),
    activeMonths: data.activeMonths.length === 12 ? [] : [...new Set(data.activeMonths)].sort((a, b) => a - b),
  }));

export type ListingSubmission = z.output<typeof listingSubmissionSchema>;

export const rideReportSchema = z.object({
  travelDate: z.string({ error: "required" }).refine(isIsoDate, { error: "required" }),
  outcome: z.enum(RIDE_OUTCOMES, { error: "required" }),
  departedAt: optionalTime,
  pricePaid: optionalInt(0, 5000),
  comment: optionalText(500),
});

export type RideReportInput = z.output<typeof rideReportSchema>;

export const problemReportSchema = z.object({
  kind: z.enum(PROBLEM_KINDS, { error: "required" }),
  message: optionalText(1000),
});

export type ProblemReportInput = z.output<typeof problemReportSchema>;

/** Flattens zod issues to { "field.path": "validationKey" }, keeping the first issue per field. */
export function fieldErrors(error: z.ZodError): Record<string, ValidationKey> {
  const result: Record<string, ValidationKey> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!(key in result)) result[key] = (issue.message as ValidationKey) ?? "required";
  }
  return result;
}
