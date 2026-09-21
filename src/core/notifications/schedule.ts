import * as Notifications from "expo-notifications";

import { createLogger } from "../logging";

const log = createLogger("notifications");

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export interface ReminderInput {
  /** Stable id (e.g. `class:${courseId}:${dayOfWeek}` or `exam:${examId}`) so re-scheduling replaces, not duplicates. */
  id: string;
  title: string;
  body: string;
  fireAt: Date;
}

/**
 * Local-only reminders (there is no server, so no push — see docs/ARCHITECTURE.md
 * "No push notifications"). Callers are responsible for re-scheduling after any
 * schedule/exam data change; this module only talks to the OS notification center.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function scheduleReminder(reminder: ReminderInput): Promise<void> {
  if (reminder.fireAt.getTime() <= Date.now()) {
    log.warn("skipped reminder in the past", { id: reminder.id });
    return;
  }
  await Notifications.cancelScheduledNotificationAsync(reminder.id).catch(() => undefined);
  await Notifications.scheduleNotificationAsync({
    identifier: reminder.id,
    content: { title: reminder.title, body: reminder.body },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminder.fireAt },
  });
}

export async function cancelReminder(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}

export async function cancelRemindersWithPrefix(prefix: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(prefix))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}
