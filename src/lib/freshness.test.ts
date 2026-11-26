import { describe, expect, it } from "vitest";
import { freshness, lastVerifiedAt } from "./freshness";

const now = new Date("2026-11-26T12:00:00Z");
const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000);

describe("lastVerifiedAt", () => {
  it("picks the most recent confirmation", () => {
    expect(lastVerifiedAt(daysAgo(10), daysAgo(2))).toEqual(daysAgo(2));
    expect(lastVerifiedAt(daysAgo(1), daysAgo(20))).toEqual(daysAgo(1));
    expect(lastVerifiedAt(null, daysAgo(3))).toEqual(daysAgo(3));
    expect(lastVerifiedAt(null, null)).toBeNull();
  });
});

describe("freshness", () => {
  it("classifies listings by age of their last confirmation", () => {
    expect(freshness(daysAgo(5), now)).toBe("fresh");
    expect(freshness(daysAgo(60), now)).toBe("fresh");
    expect(freshness(daysAgo(61), now)).toBe("stale");
    expect(freshness(daysAgo(181), now)).toBe("expired");
    expect(freshness(null, now)).toBe("unknown");
  });
});
