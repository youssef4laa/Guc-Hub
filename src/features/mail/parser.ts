import { parse } from "node-html-parser";

import { PortalError } from "../../core/portal/PortalError";
import { mailItemSchema, type MailItem } from "./schema";

/**
 * Parses a captured GUC page into typed items. Runs against `fixtures/mail/raw/`
 * in parser.test.ts, never against invented markup — see fixtures/mail/README.md
 * for how to capture the real thing with the in-app "Capture page" tool.
 */
export function parseMailPage(html: string, sourceUrl?: string): MailItem[] {
  const root = parse(html);
  const rows = root.querySelectorAll(".mail-item");

  if (rows.length === 0) {
    throw new PortalError("PARSE_FAILED", "No .mail-item rows found — page layout may have changed.", {
      sourceUrl,
    });
  }

  return rows.map((row, index) => {
    const item = { id: row.getAttribute("data-id") ?? String(index), title: row.text.trim() };
    return mailItemSchema.parse(item);
  });
}
