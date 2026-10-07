import { useQuery } from "@tanstack/react-query";

import type { AttendanceItem } from "./schema";
import { getAttendanceSource } from "./source";

export function useAttendanceItems() {
  return useQuery({
    queryKey: ["attendance", "items"],
    queryFn: async () => {
      const source = await getAttendanceSource();
      return source.fetch();
    },
  });
}

export type AttendanceStatus = "ok" | "warning" | "danger";

export function absences(item: AttendanceItem): number {
  return Math.max(0, item.held - item.attended);
}

export function attendancePercent(item: AttendanceItem): number {
  return item.held === 0 ? 100 : (item.attended / item.held) * 100;
}

/** danger: over the limit; warning: one absence away from it. */
export function statusFor(item: AttendanceItem): AttendanceStatus {
  const missed = absences(item);
  if (missed > item.allowedAbsences) return "danger";
  if (missed >= item.allowedAbsences - 1) return "warning";
  return "ok";
}
