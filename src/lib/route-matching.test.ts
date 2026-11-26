import { describe, expect, it } from "vitest";
import { matchListing, minutesOfDay, stopsInTravelOrder } from "./route-matching";

const stops = (...ids: string[]) => ids.map((placeId) => ({ placeId }));
const tbilisiToOni = { stops: stops("tbilisi", "kutaisi", "ambrolauri", "oni"), returnTime: null };
const withReturn = { ...tbilisiToOni, returnTime: "16:00" };

describe("matchListing", () => {
  it("matches the full route", () => {
    expect(matchListing(tbilisiToOni, "tbilisi", "oni")).toEqual({
      direction: "outbound",
      boardIndex: 0,
      alightIndex: 3,
    });
  });

  it("matches any later stop along the way", () => {
    expect(matchListing(tbilisiToOni, "tbilisi", "ambrolauri")?.alightIndex).toBe(2);
    expect(matchListing(tbilisiToOni, "kutaisi", "oni")?.boardIndex).toBe(1);
  });

  it("does not match the reverse direction for one-way listings", () => {
    expect(matchListing(tbilisiToOni, "oni", "tbilisi")).toBeNull();
  });

  it("matches the reverse direction when the driver returns", () => {
    expect(matchListing(withReturn, "oni", "kutaisi")).toEqual({
      direction: "return",
      boardIndex: 3,
      alightIndex: 1,
    });
  });

  it("ignores places that are not on the route and identical endpoints", () => {
    expect(matchListing(withReturn, "tbilisi", "batumi")).toBeNull();
    expect(matchListing(withReturn, "oni", "oni")).toBeNull();
  });
});

describe("stopsInTravelOrder", () => {
  it("reverses stops for return trips without mutating the input", () => {
    const list = ["a", "b", "c"];
    expect(stopsInTravelOrder(list, "return")).toEqual(["c", "b", "a"]);
    expect(list).toEqual(["a", "b", "c"]);
  });
});

describe("minutesOfDay", () => {
  it("parses HH:MM and sorts invalid values last", () => {
    expect(minutesOfDay("08:30")).toBe(510);
    expect(minutesOfDay("7:05")).toBe(425);
    expect(minutesOfDay(null)).toBe(Number.MAX_SAFE_INTEGER);
  });
});
