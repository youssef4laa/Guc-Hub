import { parse } from "node-html-parser";

import { PortalError } from "../../core/portal/PortalError";
import { gradesItemSchema, type GradesItem } from "./schema";

/**
 * Parses a captured GUC page into typed items. Runs against `fixtures/grades/raw/`
 * in parser.test.ts, never against invented markup — see fixtures/grades/README.md
 * for how to capture the real thing with the in-app "Capture page" tool.
 */
export function parseGradesPage(html: string, sourceUrl?: string): GradesItem[] {
  const root = parse(html);
  const rows = root.querySelectorAll(".grades-item");

  if (rows.length === 0) {
    throw new PortalError("PARSE_FAILED", "No .grades-item rows found — page layout may have changed.", {
      sourceUrl,
    });
  }

  return rows.map((row, index) => {
    const item = { id: row.getAttribute("data-id") ?? String(index), title: row.text.trim() };
    return gradesItemSchema.parse(item);
  });
}
