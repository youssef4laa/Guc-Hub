import { parse } from "node-html-parser";

import { PortalError } from "../../core/portal/PortalError";
import { cmsItemSchema, type CmsItem } from "./schema";

/**
 * Parses a captured GUC page into typed items. Runs against `fixtures/cms/raw/`
 * in parser.test.ts, never against invented markup — see fixtures/cms/README.md
 * for how to capture the real thing with the in-app "Capture page" tool.
 */
export function parseCmsPage(html: string, sourceUrl?: string): CmsItem[] {
  const root = parse(html);
  const rows = root.querySelectorAll(".cms-item");

  if (rows.length === 0) {
    throw new PortalError("PARSE_FAILED", "No .cms-item rows found — page layout may have changed.", {
      sourceUrl,
    });
  }

  return rows.map((row, index) => {
    const item = { id: row.getAttribute("data-id") ?? String(index), title: row.text.trim() };
    return cmsItemSchema.parse(item);
  });
}
