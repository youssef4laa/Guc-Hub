import { parse } from "node-html-parser";

import { PortalError } from "../../core/portal/PortalError";
import { transcriptItemSchema, type TranscriptItem } from "./schema";

/**
 * Parses a captured GUC page into typed items. Runs against `fixtures/transcript/raw/`
 * in parser.test.ts, never against invented markup — see fixtures/transcript/README.md
 * for how to capture the real thing with the in-app "Capture page" tool.
 */
export function parseTranscriptPage(html: string, sourceUrl?: string): TranscriptItem[] {
  const root = parse(html);
  const rows = root.querySelectorAll(".transcript-item");

  if (rows.length === 0) {
    throw new PortalError("PARSE_FAILED", "No .transcript-item rows found — page layout may have changed.", {
      sourceUrl,
    });
  }

  return rows.map((row, index) => {
    const item = { id: row.getAttribute("data-id") ?? String(index), title: row.text.trim() };
    return transcriptItemSchema.parse(item);
  });
}
