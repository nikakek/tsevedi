import type { Locale } from "@/i18n/config";
import { LOCALE_TAGS } from "@/i18n/config";

export const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7] as const;
export const GEORGIA_TIME_ZONE = "Asia/Tbilisi";

/** Today's date in Georgia as YYYY-MM-DD, regardless of the server's time zone. */
export function todayInGeorgia(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: GEORGIA_TIME_ZONE }).format(now);
}

export function isIsoDate(value: string | undefined | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

/** ISO weekday (1 = Monday ... 7 = Sunday) of a YYYY-MM-DD date. */
export function isoWeekday(isoDate: string): number {
  const day = new Date(`${isoDate}T00:00:00Z`).getUTCDay();
  return day === 0 ? 7 : day;
}

export function runsOn(
  schedule: { days: number[]; activeMonths: number[] },
  isoDate: string,
): boolean {
  const month = Number(isoDate.slice(5, 7));
  const inSeason = schedule.activeMonths.length === 0 || schedule.activeMonths.includes(month);
  return inSeason && schedule.days.includes(isoWeekday(isoDate));
}

// 2024-01-01 was a Monday, so day N of that week has ISO weekday N.
function weekdayName(day: number, locale: Locale, width: "short" | "long") {
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], { weekday: width, timeZone: "UTC" }).format(
    new Date(Date.UTC(2024, 0, day)),
  );
}

function monthName(month: number, locale: Locale) {
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], { month: "short", timeZone: "UTC" }).format(
    new Date(Date.UTC(2024, month - 1, 1)),
  );
}

/** Groups sorted numbers into runs: [1,2,3,5] → [[1,3],[5,5]]. */
function toRanges(values: number[]): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  for (const value of [...new Set(values)].sort((a, b) => a - b)) {
    const last = ranges.at(-1);
    if (last && value === last[1] + 1) last[1] = value;
    else ranges.push([value, value]);
  }
  return ranges;
}

/** "Mon–Fri", "Mon, Wed, Fri". Returns null for every day so callers can show "Daily". */
export function formatDays(days: number[], locale: Locale): string | null {
  if (ALL_DAYS.every((day) => days.includes(day))) return null;
  return toRanges(days)
    .map(([start, end]) => {
      if (end - start >= 2)
        return `${weekdayName(start, locale, "short")}–${weekdayName(end, locale, "short")}`;
      if (end > start)
        return `${weekdayName(start, locale, "short")}, ${weekdayName(end, locale, "short")}`;
      return weekdayName(start, locale, "short");
    })
    .join(", ");
}

/** "Jun–Sep". Returns null for all year. Handles seasons that wrap the new year (Nov–Mar). */
export function formatMonths(months: number[], locale: Locale): string | null {
  const unique = [...new Set(months)].sort((a, b) => a - b);
  if (unique.length === 0 || unique.length === 12) return null;
  let ranges = toRanges(unique);
  if (ranges.length > 1 && ranges[0][0] === 1 && ranges.at(-1)![1] === 12) {
    const wrapped: [number, number] = [ranges.at(-1)![0], ranges[0][1]];
    ranges = [wrapped, ...ranges.slice(1, -1)];
  }
  return ranges
    .map(([start, end]) =>
      start === end
        ? monthName(start, locale)
        : `${monthName(start, locale)}–${monthName(end, locale)}`,
    )
    .join(", ");
}

export { weekdayName };
