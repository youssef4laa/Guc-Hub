import { cancelRemindersWithPrefix, scheduleReminder } from "../../core/notifications";
import type { ClassSession } from "./schema";

const PREFIX = "schedule.class:";
const REMIND_BEFORE_MINUTES = 10;

/**
 * Reschedules every class reminder from scratch. Good enough for a scaffold; a
 * naive next-occurrence calc using the device's local time (Expo has no built-in
 * cross-platform IANA timezone conversion) — acceptable while the whole demo
 * schedule is fake, revisit if the device timezone ever meaningfully differs from
 * Africa/Cairo.
 */
export async function rescheduleClassReminders(sessions: ClassSession[]): Promise<void> {
  await cancelRemindersWithPrefix(PREFIX);
  for (const session of sessions) {
    const fireAt = nextOccurrence(session.dayOfWeek, session.startMinutes - REMIND_BEFORE_MINUTES);
    await scheduleReminder({
      id: `${PREFIX}${session.id}`,
      title: `${session.courseCode} starts in ${REMIND_BEFORE_MINUTES} minutes`,
      body: `${session.courseName} — ${session.location}`,
      fireAt,
    });
  }
}

function nextOccurrence(dayOfWeek: number, minutesSinceMidnight: number): Date {
  const now = new Date();
  const result = new Date(now);
  result.setHours(0, minutesSinceMidnight, 0, 0);

  let dayDelta = (dayOfWeek - now.getDay() + 7) % 7;
  if (dayDelta === 0 && result.getTime() <= now.getTime()) dayDelta = 7;

  result.setDate(result.getDate() + dayDelta);
  return result;
}
