import { isDemoMode } from "../../core/portal/demoMode";
import type { ClassSession } from "./schema";

export interface ScheduleSource {
  fetch(): Promise<ClassSession[]>;
}

export async function getScheduleSource(): Promise<ScheduleSource> {
  if (await isDemoMode()) {
    const { mockScheduleSource } = await import("./mock");
    return mockScheduleSource;
  }
  const { liveScheduleSource } = await import("./live");
  return liveScheduleSource;
}
