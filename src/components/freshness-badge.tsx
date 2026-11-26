import { CircleAlert, CircleCheck, CircleHelp } from "lucide-react";
import type { Dictionary } from "@/i18n/dictionaries";
import { t } from "@/i18n/format";
import type { Freshness } from "@/lib/freshness";

export function FreshnessBadge({
  freshness,
  daysAgo,
  dict,
}: {
  freshness: Freshness;
  daysAgo: number | null;
  dict: Dictionary["listing"];
}) {
  if (freshness === "unknown" || daysAgo === null) {
    return (
      <span className="text-muted inline-flex items-center gap-1 text-xs">
        <CircleHelp className="size-3.5" aria-hidden /> {dict.unverified}
      </span>
    );
  }
  if (freshness === "fresh") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
        <CircleCheck className="size-3.5" aria-hidden />
        {daysAgo === 0
          ? dict.verifiedToday
          : daysAgo === 1
            ? dict.verifiedYesterday
            : t(dict.verifiedDays, { count: daysAgo })}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-amber-700">
      <CircleAlert className="size-3.5" aria-hidden /> {t(dict.stale, { count: daysAgo })}
    </span>
  );
}
