import { parse } from "node-html-parser";

import { PortalError } from "../../core/portal/PortalError";
import { attendanceItemSchema, type AttendanceItem } from "./schema";

/**
 * Parses a captured GUC page into typed items. Runs against `fixtures/attendance/raw/`
 * in parser.test.ts, never against invented markup — see fixtures/attendance/README.md
 * for how to capture the real thing with the in-app "Capture page" tool.
 */
export function parseAttendancePage(html: string, sourceUrl?: string): AttendanceItem[] {
  const root = parse(html);
  const rows = root.querySelectorAll(".attendance-item");

  if (rows.length === 0) {
    throw new PortalError("PARSE_FAILED", "No .attendance-item rows found — page layout may have changed.", {
      sourceUrl,
    });
  }

  return rows.map((row, index) => {
    const item = { id: row.getAttribute("data-id") ?? String(index), title: row.text.trim() };
    return attendanceItemSchema.parse(item);
  });
}
