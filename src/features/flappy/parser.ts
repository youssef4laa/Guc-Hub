import { parse } from "node-html-parser";

import { PortalError } from "../../core/portal/PortalError";
import { flappyItemSchema, type FlappyItem } from "./schema";

/**
 * Parses a captured GUC page into typed items. Runs against `fixtures/flappy/raw/`
 * in parser.test.ts, never against invented markup — see fixtures/flappy/README.md
 * for how to capture the real thing with the in-app "Capture page" tool.
 */
export function parseFlappyPage(html: string, sourceUrl?: string): FlappyItem[] {
  const root = parse(html);
  const rows = root.querySelectorAll(".flappy-item");

  if (rows.length === 0) {
    throw new PortalError("PARSE_FAILED", "No .flappy-item rows found — page layout may have changed.", {
      sourceUrl,
    });
  }

  return rows.map((row, index) => {
    const item = { id: row.getAttribute("data-id") ?? String(index), title: row.text.trim() };
    return flappyItemSchema.parse(item);
  });
}
