import { isDemoMode } from "../../core/portal/demoMode";
import type { StaffItem } from "./schema";

export interface StaffSource {
  fetch(): Promise<StaffItem[]>;
}

export async function getStaffSource(): Promise<StaffSource> {
  if (await isDemoMode()) {
    const { mockStaffSource } = await import("./mock");
    return mockStaffSource;
  }
  const { liveStaffSource } = await import("./live");
  return liveStaffSource;
}
