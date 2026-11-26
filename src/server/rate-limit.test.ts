import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { clientIp, isLimited, rateLimit } = await import("./rate-limit");

afterEach(() => vi.useRealTimers());

describe("rateLimit", () => {
  it("allows up to the limit within a window, then blocks", () => {
    const key = `test-${Math.random()}`;
    expect([1, 2, 3].map(() => rateLimit(key, 2, 1000))).toEqual([true, true, false]);
    expect(isLimited(key, 2)).toBe(true);
  });

  it("resets after the window", () => {
    vi.useFakeTimers();
    const key = `test-${Math.random()}`;
    rateLimit(key, 1, 1000);
    expect(rateLimit(key, 1, 1000)).toBe(false);
    vi.advanceTimersByTime(1001);
    expect(isLimited(key, 1)).toBe(false);
    expect(rateLimit(key, 1, 1000)).toBe(true);
  });
});

describe("clientIp", () => {
  it("uses the first X-Forwarded-For address", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe("1.2.3.4");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
