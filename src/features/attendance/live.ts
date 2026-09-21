import { notImplemented } from "../../core/portal/PortalError";
import type { AttendanceSource } from "./source";

export const liveAttendanceSource: AttendanceSource = {
  async fetch() {
    // Replace with: gucFetch(url) -> parser.ts -> attendanceItemSchema.parse(...).
    // Capture a real page first with the in-app "Capture page" dev tool.
    notImplemented("attendance");
  },
};
