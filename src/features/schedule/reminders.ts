import { planWeeklyReminders, syncReminders } from "../../core/notifications";
import type { ClassSession } from "./schema";

const PREFIX = "schedule.class:";
const REMIND_BEFORE_MINUTES = 10;

/**
 * Replaces every class reminder from scratch. Goes through core/notifications so the
 * notification permission is requested, the Android channel exists, and the platform
 * budget is respected — without those Android 13+ never shows a reminder at all.
 */
export async function rescheduleClassReminders(sessions: ClassSession[]): Promise<void> {
  const reminders = planWeeklyReminders(
    sessions.map((session) => ({
      id: `${PREFIX}${session.id}`,
      title: `${session.courseCode} starts in ${REMIND_BEFORE_MINUTES} minutes`,
      body: `${session.courseName} — ${session.location}`,
      dayOfWeek: session.dayOfWeek,
      startMinutes: session.startMinutes,
    })),
    { minutesBefore: REMIND_BEFORE_MINUTES },
  );
  await syncReminders(PREFIX, reminders);
}
