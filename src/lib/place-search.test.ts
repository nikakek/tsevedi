import { describe, expect, it } from "vitest";
import { buildPlaceIndex, editDistance, searchPlaces } from "./place-search";

const places = [
  { slug: "tbilisi", nameKa: "თბილისი", nameEn: "Tbilisi", nameRu: "Тбилиси", aliases: ["Tiflis"] },
  { slug: "tbilisi-airport", nameKa: "თბილისის აეროპორტი", nameEn: "Tbilisi Airport", nameRu: "Аэропорт Тбилиси", aliases: ["TBS"] },
  { slug: "ambrolauri", nameKa: "ამბროლაური", nameEn: "Ambrolauri", nameRu: "Амбролаури", aliases: ["Racha"] },
  { slug: "oni", nameKa: "ონი", nameEn: "Oni", nameRu: "Они", aliases: [] },
  { slug: "stepantsminda", nameKa: "სტეფანწმინდა", nameEn: "Stepantsminda (Kazbegi)", nameRu: "Степанцминда (Казбеги)", aliases: ["Kazbegi"] },
  { slug: "kvareli", nameKa: "ყვარელი", nameEn: "Kvareli", nameRu: "Кварели", aliases: ["Qvareli"] },
];
const index = buildPlaceIndex(places);
const slugs = (query: string) => searchPlaces(index, query).map((place) => place.slug);

describe("searchPlaces", () => {
  it("finds places by prefix in all three scripts", () => {
    expect(slugs("amb")[0]).toBe("ambrolauri");
    expect(slugs("ამბ")[0]).toBe("ambrolauri");
    expect(slugs("Амб")[0]).toBe("ambrolauri");
  });

  it("finds places by alias and by either part of a bracketed name", () => {
    expect(slugs("kazbegi")[0]).toBe("stepantsminda");
    expect(slugs("Казбеги")[0]).toBe("stepantsminda");
    expect(slugs("racha")[0]).toBe("ambrolauri");
    expect(slugs("TBS")[0]).toBe("tbilisi-airport");
  });

  it("ranks exact matches above longer names", () => {
    expect(slugs("tbilisi")).toEqual(["tbilisi", "tbilisi-airport"]);
  });

  it("tolerates small typos", () => {
    expect(slugs("ambrolari")[0]).toBe("ambrolauri");
    expect(slugs("kvarelli")[0]).toBe("kvareli");
  });

  it("returns nothing for empty or unrelated queries", () => {
    expect(slugs("")).toEqual([]);
    expect(slugs("   ")).toEqual([]);
    expect(slugs("zzzz")).toEqual([]);
  });
});

describe("editDistance", () => {
  it("counts single-character edits", () => {
    expect(editDistance("oni", "oni")).toBe(0);
    expect(editDistance("oni", "ani")).toBe(1);
    expect(editDistance("kutaisi", "kutasi")).toBe(1);
  });

  it("stops early when the distance exceeds the limit", () => {
    expect(editDistance("batumi", "zugdidi", 2)).toBe(3);
  });
});
