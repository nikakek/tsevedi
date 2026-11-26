import { DEFAULT_LOCALE, isLocale, type Locale } from "./config";

/**
 * Picks the best supported locale from an Accept-Language header,
 * e.g. "ru-RU,ru;q=0.9,en;q=0.8" → "ru". A saved preference cookie always wins.
 */
export function negotiateLocale(acceptLanguage: string | null, saved?: string | null): Locale {
  if (isLocale(saved)) return saved;
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const ranked = acceptLanguage
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      const quality = q ? Number(q.slice(2)) : 1;
      return {
        lang: tag.toLowerCase().split("-")[0],
        quality: Number.isNaN(quality) ? 0 : quality,
        index,
      };
    })
    .filter((entry) => entry.quality > 0)
    .sort((a, b) => b.quality - a.quality || a.index - b.index);

  return (ranked.find((entry) => isLocale(entry.lang))?.lang as Locale) ?? DEFAULT_LOCALE;
}
