import { describe, expect, it } from "vitest";
import { negotiateLocale } from "./negotiate";

describe("negotiateLocale", () => {
  it("uses the highest-ranked supported language", () => {
    expect(negotiateLocale("ru-RU,ru;q=0.9,en;q=0.8")).toBe("ru");
    expect(negotiateLocale("ka-GE,ka;q=0.9")).toBe("ka");
    expect(negotiateLocale("de-DE,de;q=0.9,en;q=0.5,ru;q=0.4")).toBe("en");
    expect(negotiateLocale("en;q=0.3,ru;q=0.8")).toBe("ru");
  });

  it("falls back to English for unsupported or missing headers", () => {
    expect(negotiateLocale("de-DE,fr;q=0.8")).toBe("en");
    expect(negotiateLocale(null)).toBe("en");
    expect(negotiateLocale("ru;q=0")).toBe("en");
  });

  it("prefers a saved choice over the header", () => {
    expect(negotiateLocale("ru-RU", "ka")).toBe("ka");
    expect(negotiateLocale("ru-RU", "xx")).toBe("ru");
  });
});
