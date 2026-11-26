import { describe, expect, it } from "vitest";
import { paths, safeNext } from "./paths";

describe("safeNext", () => {
  it("allows paths on this site", () => {
    expect(safeNext("/en/account", "/fallback")).toBe("/en/account");
    expect(safeNext("/ka/add?from=tbilisi", "/fallback")).toBe("/ka/add?from=tbilisi");
  });

  it("rejects other sites and junk, so sign-in can't redirect elsewhere", () => {
    expect(safeNext("https://evil.example", "/fallback")).toBe("/fallback");
    expect(safeNext("//evil.example", "/fallback")).toBe("/fallback");
    expect(safeNext(undefined, "/fallback")).toBe("/fallback");
    expect(safeNext(["/en"], "/fallback")).toBe("/fallback");
  });
});

describe("paths.signIn", () => {
  it("encodes where to return after signing in", () => {
    expect(paths.signIn("en", "/en/add?from=a&to=b")).toBe(
      "/en/signin?next=%2Fen%2Fadd%3Ffrom%3Da%26to%3Db",
    );
    expect(paths.signIn("ka")).toBe("/ka/signin");
  });
});
