import { isDemoMode } from "../../core/portal/demoMode";
import type { AttendanceItem } from "./schema";

export interface AttendanceSource {
  fetch(): Promise<AttendanceItem[]>;
}

export async function getAttendanceSource(): Promise<AttendanceSource> {
  if (await isDemoMode()) {
    const { mockAttendanceSource } = await import("./mock");
    return mockAttendanceSource;
  }
  const { liveAttendanceSource } = await import("./live");
  return liveAttendanceSource;
}
