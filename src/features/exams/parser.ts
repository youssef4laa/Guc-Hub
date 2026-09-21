import { parse } from "node-html-parser";

import { PortalError } from "../../core/portal/PortalError";
import { examsItemSchema, type ExamsItem } from "./schema";

/**
 * Parses a captured GUC page into typed items. Runs against `fixtures/exams/raw/`
 * in parser.test.ts, never against invented markup — see fixtures/exams/README.md
 * for how to capture the real thing with the in-app "Capture page" tool.
 */
export function parseExamsPage(html: string, sourceUrl?: string): ExamsItem[] {
  const root = parse(html);
  const rows = root.querySelectorAll(".exams-item");

  if (rows.length === 0) {
    throw new PortalError("PARSE_FAILED", "No .exams-item rows found — page layout may have changed.", {
      sourceUrl,
    });
  }

  return rows.map((row, index) => {
    const item = { id: row.getAttribute("data-id") ?? String(index), title: row.text.trim() };
    return examsItemSchema.parse(item);
  });
}
