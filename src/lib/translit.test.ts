import { describe, expect, it } from "vitest";
import { searchKey, slugify, transliterate } from "./translit";

describe("transliterate", () => {
  it("converts Georgian script to Latin", () => {
    expect(transliterate("ამბროლაური")).toBe("ambrolauri");
    expect(transliterate("ყვარელი")).toBe("qvareli");
    expect(transliterate("წყალტუბო")).toBe("tsqaltubo");
  });

  it("converts Cyrillic to Latin", () => {
    expect(transliterate("Кутаиси")).toBe("kutaisi");
    expect(transliterate("Цхалтубо")).toBe("tskhaltubo");
  });

  it("leaves Latin text lowercase and otherwise untouched", () => {
    expect(transliterate("Batumi 2")).toBe("batumi 2");
  });
});

describe("searchKey", () => {
  it.each([
    ["ყაზბეგი", "Kazbegi"],
    ["Казбеги", "kazbegi"],
    ["Qvareli", "Kvareli"],
    ["ყვარელი", "Кварели"],
    ["Tsqaltubo", "Tskhaltubo"],
    ["წყალტუბო", "Цхалтубо"],
    ["Signagi", "Sighnaghi"],
    ["Zestafoni", "Zestaponi"],
    ["Местия", "Mestiya"],
  ])("treats %s and %s as the same place", (a, b) => {
    expect(searchKey(a)).toBe(searchKey(b));
  });

  it("ignores spaces, punctuation and accents", () => {
    expect(searchKey("Kvemo-Alvani")).toBe(searchKey("kvemo alvani"));
    expect(searchKey("Tbilísi")).toBe(searchKey("tbilisi"));
  });
});

describe("slugify", () => {
  it("creates URL-safe slugs from any script", () => {
    expect(slugify("ქვემო ალვანი")).toBe("kvemo-alvani");
    expect(slugify("Stepantsminda (Kazbegi)")).toBe("stepantsminda-kazbegi");
  });
});
