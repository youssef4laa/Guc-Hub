import { TIMEZONE } from "../../../core/i18n";

// Dates are shown in Cairo time regardless of device timezone, like every other
// GUC-facing date in the app (see core/i18n).

function calendarDay(date: Date): string {
  // en-CA formats as YYYY-MM-DD, which compares cleanly as a string.
  return date.toLocaleDateString("en-CA", { timeZone: TIMEZONE });
}

/** Compact date for a list row: time today, "Sep 21" this year, "Sep 21, 2025" otherwise. */
export function formatListDate(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (calendarDay(date) === calendarDay(now)) {
    return date.toLocaleTimeString("en-US", { timeZone: TIMEZONE, hour: "numeric", minute: "2-digit" });
  }
  const sameYear = calendarDay(date).slice(0, 4) === calendarDay(now).slice(0, 4);
  return date.toLocaleDateString("en-US", {
    timeZone: TIMEZONE,
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

/** Full date for the reader header, e.g. "Mon, Sep 21, 2026, 2:05 PM". */
export function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    timeZone: TIMEZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
