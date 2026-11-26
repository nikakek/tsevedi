import { describe, expect, it } from "vitest";
import { driverCardPhrase, kaFrom, kaLocative } from "./phrases";

describe("kaLocative", () => {
  it.each([
    ["ონი", "ონში"],
    ["თბილისი", "თბილისში"],
    ["მესტია", "მესტიაში"],
    ["ომალო", "ომალოში"],
    ["ქვემო ალვანი", "ქვემო ალვანში"],
    ["თბილისის აეროპორტი", "თბილისის აეროპორტში"],
  ])("%s → %s", (name, expected) => {
    expect(kaLocative(name)).toBe(expected);
  });
});

describe("kaFrom", () => {
  it.each([
    ["ონი", "ონიდან"],
    ["თბილისი", "თბილისიდან"],
    ["მესტია", "მესტიიდან"],
    ["სტეფანწმინდა", "სტეფანწმინდიდან"],
    ["ბაქო", "ბაქოდან"],
  ])("%s → %s", (name, expected) => {
    expect(kaFrom(name)).toBe(expected);
  });
});

describe("driverCardPhrase", () => {
  it("includes the destination and the price when known", () => {
    const lines = driverCardPhrase({ toKa: "ონი", price: 25 });
    expect(lines).toContain("ონში მინდა წასვლა.");
    expect(lines).toContain("ფასი 25 ლარია, ასეა?");
  });

  it("omits the price line when the price is unknown", () => {
    expect(driverCardPhrase({ toKa: "ონი" }).some((line) => line.includes("ლარი"))).toBe(false);
  });
});
