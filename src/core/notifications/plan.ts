import { TIMEZONE } from "../i18n";

/**
 * Pure reminder planning: turns "this class happens Sundays at 09:00" or "this
 * exam is on 18 October at 09:00" into concrete fire times. No expo-notifications
 * import here on purpose, so the timing rules can be tested without a device.
 *
 * Times are resolved in Cairo time (core/i18n's TIMEZONE), not the device's:
 * a 9 AM class is 9 AM in Cairo whether or not the student's phone is on
 * another timezone, and Egypt's summer time must not shift a reminder by an hour.
 */

export interface ReminderInput {
  /** Stable id (e.g. `class:${courseId}:${dayOfWeek}` or `exam:${examId}`) so re-scheduling replaces, not duplicates. */
  id: string;
  title: string;
  body: string;
  fireAt: Date;
}

/** A thing that happens every week at the same local time, e.g. a class. */
export interface WeeklyReminderSpec {
  id: string;
  title: string;
  body: string;
  /** 0 = Sunday, matching the GUC week. */
  dayOfWeek: number;
  /** Minutes since midnight, Cairo time. */
  startMinutes: number;
}

/** A thing that happens once, e.g. an exam or a custom event. */
export interface DatedReminderSpec {
  id: string;
  title: string;
  body: string;
  /** ISO 8601 instant. */
  at: string;
}

export interface PlanOptions {
  /** How long before the event to fire. Default 10 minutes. */
  minutesBefore?: number;
  now?: Date;
  /** How many weeks ahead to schedule each weekly event. Default 1. */
  weeksAhead?: number;
  timeZone?: string;
}

/**
 * iOS keeps only the 64 soonest-firing local notification requests per app and
 * silently discards the rest, so every feature scheduling reminders is spending
 * from one shared budget. Keep well under it.
 * https://developer.apple.com/documentation/usernotifications/unusernotificationcenter
 */
export const IOS_PENDING_NOTIFICATION_LIMIT = 64;

/** Per-feature default, leaving room for the other features that also schedule. */
export const DEFAULT_REMINDER_BUDGET = 24;

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  weekday: number;
}

function zonedParts(instant: Date, timeZone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(instant);

  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    weekday: weekdays.indexOf(get("weekday")),
  };
}

/** How far the zone is from UTC at a given instant, in milliseconds. */
function zoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);

  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? "0");
  // `hour` comes back as 24 at midnight under hour12: false.
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second"),
  );
  return asUtc - instant.getTime();
}

/**
 * The instant at which the given wall-clock time occurs in `timeZone`. Resolved
 * twice because the offset itself depends on the instant — that second pass is
 * what keeps this correct across a daylight-saving change.
 */
export function zonedWallClockToInstant(
  parts: { year: number; month: number; day: number; minutes: number },
  timeZone: string = TIMEZONE,
): Date {
  const utcGuess = Date.UTC(parts.year, parts.month - 1, parts.day, 0, parts.minutes);
  const firstPass = new Date(utcGuess - zoneOffsetMs(new Date(utcGuess), timeZone));
  return new Date(utcGuess - zoneOffsetMs(firstPass, timeZone));
}

/** The next time this weekly slot comes round, strictly after `now`. */
export function nextWeeklyOccurrence(
  dayOfWeek: number,
  startMinutes: number,
  { now = new Date(), timeZone = TIMEZONE }: { now?: Date; timeZone?: string } = {},
): Date {
  const today = zonedParts(now, timeZone);
  const daysAhead = (dayOfWeek - today.weekday + 7) % 7;

  for (const offset of [daysAhead, daysAhead + 7]) {
    const target = zonedParts(new Date(now.getTime() + offset * DAY_MS), timeZone);
    const instant = zonedWallClockToInstant({ ...target, minutes: startMinutes }, timeZone);
    if (instant.getTime() > now.getTime()) return instant;
  }

  // Unreachable in practice: the +7 candidate is always in the future.
  return zonedWallClockToInstant({ ...today, minutes: startMinutes }, timeZone);
}

export function planWeeklyReminders(specs: WeeklyReminderSpec[], options: PlanOptions = {}): ReminderInput[] {
  const { minutesBefore = 10, now = new Date(), weeksAhead = 1, timeZone = TIMEZONE } = options;
  const reminders: ReminderInput[] = [];

  const wanted = Math.max(1, weeksAhead);

  for (const spec of specs) {
    const first = nextWeeklyOccurrence(spec.dayOfWeek, spec.startMinutes, { now, timeZone });
    let added = 0;
    // Scans one week past `wanted`: if the app is opened between the reminder
    // time and the class itself, that occurrence is already unreachable, and the
    // student should still get the following week's rather than nothing.
    for (let week = 0; added < wanted && week <= wanted; week++) {
      const fireAt = new Date(first.getTime() + week * 7 * DAY_MS - minutesBefore * MINUTE_MS);
      if (fireAt.getTime() <= now.getTime()) continue;
      reminders.push({
        // One id per occurrence, so a later re-plan replaces the same slot.
        id: added === 0 ? spec.id : `${spec.id}+${added}`,
        title: spec.title,
        body: spec.body,
        fireAt,
      });
      added++;
    }
  }
  return reminders;
}

export function planDatedReminders(specs: DatedReminderSpec[], options: PlanOptions = {}): ReminderInput[] {
  const { minutesBefore = 10, now = new Date() } = options;

  return specs.flatMap((spec) => {
    const at = Date.parse(spec.at);
    if (Number.isNaN(at)) return [];
    const fireAt = new Date(at - minutesBefore * MINUTE_MS);
    if (fireAt.getTime() <= now.getTime()) return [];
    return [{ id: spec.id, title: spec.title, body: spec.body, fireAt }];
  });
}

/**
 * Soonest first, capped at `max`. Ordering matters: iOS drops whatever doesn't
 * fit, so the reminders most likely to be useful must be the ones we keep.
 */
export function limitReminders(
  reminders: ReminderInput[],
  max: number = DEFAULT_REMINDER_BUDGET,
): ReminderInput[] {
  return [...reminders].sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime()).slice(0, Math.max(0, max));
}
