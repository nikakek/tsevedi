import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next/server", () => ({ connection: vi.fn() }));

const { checkPassword, createSessionToken, verifySessionToken } = await import("./admin-auth");

beforeAll(() => {
  process.env.SESSION_SECRET = "test-secret-that-is-definitely-long-enough";
  process.env.ADMIN_PASSWORD = "correct horse battery staple";
});

describe("admin session tokens", () => {
  it("accepts a fresh token and rejects it after expiry", () => {
    const now = Date.now();
    const { token } = createSessionToken(now);
    expect(verifySessionToken(token, now)).toBe(true);
    expect(verifySessionToken(token, now + 8 * 24 * 60 * 60 * 1000)).toBe(false);
  });

  it("rejects tampered or malformed tokens", () => {
    const { token } = createSessionToken();
    const [expires, signature] = token.split(".");
    expect(verifySessionToken(`${Number(expires) + 1}.${signature}`)).toBe(false);
    expect(verifySessionToken(`${expires}.AAAA`)).toBe(false);
    expect(verifySessionToken("garbage")).toBe(false);
    expect(verifySessionToken(undefined)).toBe(false);
  });
});

describe("checkPassword", () => {
  it("compares against ADMIN_PASSWORD", () => {
    expect(checkPassword("correct horse battery staple")).toBe(true);
    expect(checkPassword("wrong")).toBe(false);
    expect(checkPassword("")).toBe(false);
  });
});
