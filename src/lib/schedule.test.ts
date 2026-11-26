import { describe, expect, it } from "vitest";
import {
  formatDays,
  formatMonths,
  isIsoDate,
  isoWeekday,
  runsOn,
  todayInGeorgia,
} from "./schedule";

describe("isoWeekday", () => {
  it("returns 1 for Monday and 7 for Sunday", () => {
    expect(isoWeekday("2026-11-23")).toBe(1);
    expect(isoWeekday("2026-11-29")).toBe(7);
  });
});

describe("runsOn", () => {
  const summerWeekdays = { days: [1, 2, 3, 4, 5], activeMonths: [6, 7, 8, 9] };

  it("checks both weekday and season", () => {
    expect(runsOn(summerWeekdays, "2026-07-01")).toBe(true); // Wednesday in July
    expect(runsOn(summerWeekdays, "2026-07-04")).toBe(false); // Saturday
    expect(runsOn(summerWeekdays, "2026-11-25")).toBe(false); // out of season
  });

  it("treats an empty month list as all year", () => {
    expect(runsOn({ days: [3], activeMonths: [] }, "2026-11-25")).toBe(true);
  });
});

describe("todayInGeorgia", () => {
  it("uses Georgian time (UTC+4)", () => {
    expect(todayInGeorgia(new Date("2026-11-26T21:30:00Z"))).toBe("2026-11-27");
    expect(todayInGeorgia(new Date("2026-11-26T19:30:00Z"))).toBe("2026-11-26");
  });
});

describe("isIsoDate", () => {
  it("accepts only real calendar dates", () => {
    expect(isIsoDate("2026-02-28")).toBe(true);
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("26-02-01")).toBe(false);
    expect(isIsoDate(undefined)).toBe(false);
  });
});

describe("formatDays", () => {
  it("returns null for daily trips", () => {
    expect(formatDays([1, 2, 3, 4, 5, 6, 7], "en")).toBeNull();
  });

  it("collapses consecutive days into ranges", () => {
    expect(formatDays([1, 2, 3, 4, 5], "en")).toBe("Mon–Fri");
    expect(formatDays([1, 3, 5], "en")).toBe("Mon, Wed, Fri");
    expect(formatDays([6, 7], "en")).toBe("Sat, Sun");
  });
});

describe("formatMonths", () => {
  it("returns null for all-year trips", () => {
    expect(formatMonths([], "en")).toBeNull();
    expect(formatMonths([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], "en")).toBeNull();
  });

  it("formats seasons, including ones that wrap the new year", () => {
    expect(formatMonths([6, 7, 8, 9], "en")).toBe("Jun–Sep");
    expect(formatMonths([11, 12, 1, 2, 3], "en")).toBe("Nov–Mar");
  });
});
