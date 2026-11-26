import type { Locale } from "@/i18n/config";

export const REGIONS = {
  tbilisi: { ka: "თბილისი", en: "Tbilisi", ru: "Тбилиси" },
  adjara: { ka: "აჭარა", en: "Adjara", ru: "Аджария" },
  guria: { ka: "გურია", en: "Guria", ru: "Гурия" },
  imereti: { ka: "იმერეთი", en: "Imereti", ru: "Имеретия" },
  kakheti: { ka: "კახეთი", en: "Kakheti", ru: "Кахетия" },
  "kvemo-kartli": { ka: "ქვემო ქართლი", en: "Kvemo Kartli", ru: "Квемо-Картли" },
  "mtskheta-mtianeti": { ka: "მცხეთა-მთიანეთი", en: "Mtskheta-Mtianeti", ru: "Мцхета-Мтианети" },
  "racha-lechkhumi": {
    ka: "რაჭა-ლეჩხუმი",
    en: "Racha-Lechkhumi",
    ru: "Рача-Лечхуми",
  },
  "samegrelo-svaneti": {
    ka: "სამეგრელო-ზემო სვანეთი",
    en: "Samegrelo-Zemo Svaneti",
    ru: "Самегрело-Земо Сванети",
  },
  "samtskhe-javakheti": {
    ka: "სამცხე-ჯავახეთი",
    en: "Samtskhe-Javakheti",
    ru: "Самцхе-Джавахети",
  },
  "shida-kartli": { ka: "შიდა ქართლი", en: "Shida Kartli", ru: "Шида-Картли" },
  abroad: { ka: "საზღვარგარეთ", en: "Abroad", ru: "За границей" },
} as const satisfies Record<string, Record<Locale, string>>;

export type RegionKey = keyof typeof REGIONS;

export function regionName(region: string, locale: Locale): string {
  return region in REGIONS ? REGIONS[region as RegionKey][locale] : region;
}
