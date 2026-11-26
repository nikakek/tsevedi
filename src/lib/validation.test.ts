import { describe, expect, it } from "vitest";
import { fieldErrors, listingSubmissionSchema, rideReportSchema } from "./validation";

const valid = {
  driverName: "Gela",
  phone: "555 12 34 56",
  vehicleType: "MARSHRUTKA",
  stops: ["tbilisi", "ambrolauri", "oni"],
  departureTime: "09:00",
  days: [1, 2, 3, 4, 5, 6, 7],
  departurePoint: "Didube bus station",
};

describe("listingSubmissionSchema", () => {
  it("accepts a minimal submission and applies defaults", () => {
    const result = listingSubmissionSchema.parse(valid);
    expect(result.phone).toBe("+995555123456");
    expect(result.callAhead).toBe(true);
    expect(result.activeMonths).toEqual([]);
    expect(result.languages).toEqual([]);
  });

  it("turns blank optional strings into undefined", () => {
    const result = listingSubmissionSchema.parse({
      ...valid,
      vehicleModel: "  ",
      pricePerSeat: "",
    });
    expect(result.vehicleModel).toBeUndefined();
    expect(result.pricePerSeat).toBeUndefined();
  });

  it("treats all twelve months as all year and drops a return point without a return time", () => {
    const result = listingSubmissionSchema.parse({
      ...valid,
      activeMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      returnPoint: "Oni centre",
    });
    expect(result.activeMonths).toEqual([]);
    expect(result.returnPoint).toBeUndefined();
  });

  it("reports translatable error keys per field", () => {
    const result = listingSubmissionSchema.safeParse({
      ...valid,
      phone: "123",
      stops: ["oni", "oni"],
      departureTime: "25:00",
      days: [],
      departureMapsUrl: "javascript:alert(1)",
    });
    expect(result.success).toBe(false);
    expect(fieldErrors(result.error!)).toMatchObject({
      phone: "phone",
      stops: "duplicateStops",
      departureTime: "time",
      days: "days",
      departureMapsUrl: "url",
    });
  });
});

describe("rideReportSchema", () => {
  it("requires a real date and a known outcome", () => {
    expect(
      rideReportSchema.safeParse({ travelDate: "2026-07-01", outcome: "WORKED" }).success,
    ).toBe(true);
    expect(
      rideReportSchema.safeParse({ travelDate: "2026-02-31", outcome: "WORKED" }).success,
    ).toBe(false);
    expect(rideReportSchema.safeParse({ travelDate: "2026-07-01", outcome: "MAYBE" }).success).toBe(
      false,
    );
  });
});
