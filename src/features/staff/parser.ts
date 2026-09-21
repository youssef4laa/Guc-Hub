import { parse } from "node-html-parser";

import { PortalError } from "../../core/portal/PortalError";
import { staffItemSchema, type StaffItem } from "./schema";

/**
 * Parses a captured GUC page into typed items. Runs against `fixtures/staff/raw/`
 * in parser.test.ts, never against invented markup — see fixtures/staff/README.md
 * for how to capture the real thing with the in-app "Capture page" tool.
 */
export function parseStaffPage(html: string, sourceUrl?: string): StaffItem[] {
  const root = parse(html);
  const rows = root.querySelectorAll(".staff-item");

  if (rows.length === 0) {
    throw new PortalError("PARSE_FAILED", "No .staff-item rows found — page layout may have changed.", {
      sourceUrl,
    });
  }

  return rows.map((row, index) => {
    const item = { id: row.getAttribute("data-id") ?? String(index), title: row.text.trim() };
    return staffItemSchema.parse(item);
  });
}
