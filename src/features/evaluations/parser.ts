import { parse } from "node-html-parser";

import { PortalError } from "../../core/portal/PortalError";
import { evaluationsItemSchema, type EvaluationsItem } from "./schema";

/**
 * Parses a captured GUC page into typed items. Runs against `fixtures/evaluations/raw/`
 * in parser.test.ts, never against invented markup — see fixtures/evaluations/README.md
 * for how to capture the real thing with the in-app "Capture page" tool.
 */
export function parseEvaluationsPage(html: string, sourceUrl?: string): EvaluationsItem[] {
  const root = parse(html);
  const rows = root.querySelectorAll(".evaluations-item");

  if (rows.length === 0) {
    throw new PortalError("PARSE_FAILED", "No .evaluations-item rows found — page layout may have changed.", {
      sourceUrl,
    });
  }

  return rows.map((row, index) => {
    const item = { id: row.getAttribute("data-id") ?? String(index), title: row.text.trim() };
    return evaluationsItemSchema.parse(item);
  });
}
