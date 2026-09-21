import * as BackgroundTask from "expo-background-task";
import * as TaskManager from "expo-task-manager";

import { createLogger } from "../logging";

const log = createLogger("background-refresh");
const TASK_NAME = "guc-hub-background-refresh";

/**
 * Best-effort refresh only. iOS runs this opportunistically (sometimes not for
 * hours), Android is more permissive but still not a guaranteed schedule — never
 * promise "instant" anything on top of it. `task` should re-fetch cheap, high-value
 * data (e.g. "next class changed?") and reschedule local reminders if it did.
 */
export function registerBackgroundRefresh(task: () => Promise<void>): void {
  if (!TaskManager.isTaskDefined(TASK_NAME)) {
    TaskManager.defineTask(TASK_NAME, async () => {
      try {
        await task();
        return BackgroundTask.BackgroundTaskResult.Success;
      } catch (error) {
        log.warn("background refresh task failed", error);
        return BackgroundTask.BackgroundTaskResult.Failed;
      }
    });
  }
}

export async function ensureBackgroundRefreshScheduled(minimumIntervalMinutes = 60): Promise<void> {
  await BackgroundTask.registerTaskAsync(TASK_NAME, { minimumInterval: minimumIntervalMinutes });
}
