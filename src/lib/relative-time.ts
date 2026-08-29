const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "just now", "5 minutes ago", "3 days ago", or a short date after two weeks. */
export function relativeTime(thenMs: number, nowMs: number = Date.now()): string {
  const diff = Math.max(0, nowMs - thenMs);
  if (diff < MINUTE) return "just now";
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "always" });
  if (diff < HOUR) return rtf.format(-Math.floor(diff / MINUTE), "minute");
  if (diff < DAY) return rtf.format(-Math.floor(diff / HOUR), "hour");
  if (diff < 14 * DAY) return rtf.format(-Math.floor(diff / DAY), "day");
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" }).format(
    new Date(thenMs),
  );
}
