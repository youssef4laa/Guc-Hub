import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { createLogger } from "../logging";
import { DEFAULT_REMINDER_BUDGET, limitReminders, type ReminderInput } from "./plan";
import { cancelRemindersWithPrefix, requestNotificationPermission, scheduleReminder } from "./schedule";

const log = createLogger("notifications");

/** Android 8+ shows nothing at all unless the notification has a channel. */
const REMINDER_CHANNEL_ID = "reminders";

export async function ensureReminderChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: "Class and exam reminders",
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: null,
  });
}

export interface SyncResult {
  scheduled: number;
  /** How many were dropped to stay inside the platform budget. */
  dropped: number;
  /** False when the student hasn't granted notification permission. */
  permitted: boolean;
}

/**
 * Replaces every reminder under `prefix` with `reminders`, in one pass.
 *
 * Re-planning from scratch is deliberate: it's the only way to notice that a
 * class moved or an exam was cancelled, since there is no server to tell us.
 * Callers should run it whenever their data changes.
 *
 * Nothing here is guaranteed by the OS — see docs/discovery/spike-5-background-refresh.md.
 * Never promise the student an alert will definitely arrive.
 */
export async function syncReminders(
  prefix: string,
  reminders: ReminderInput[],
  { max = DEFAULT_REMINDER_BUDGET }: { max?: number } = {},
): Promise<SyncResult> {
  const granted = await requestNotificationPermission();
  if (!granted) {
    // Clear anything scheduled earlier: permission may have been revoked.
    await cancelRemindersWithPrefix(prefix);
    log.info("notification permission not granted; reminders cleared", { prefix });
    return { scheduled: 0, dropped: reminders.length, permitted: false };
  }

  await ensureReminderChannel();

  const planned = limitReminders(reminders, max);
  await cancelRemindersWithPrefix(prefix);
  for (const reminder of planned) {
    await scheduleReminder(reminder, { channelId: REMINDER_CHANNEL_ID });
  }

  const dropped = reminders.length - planned.length;
  log.info("reminders synced", { prefix, scheduled: planned.length, dropped });
  return { scheduled: planned.length, dropped, permitted: true };
}
