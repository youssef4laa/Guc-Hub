import { parse } from "node-html-parser";

import { PortalError } from "../../core/portal/PortalError";
import { templateItemSchema, type TemplateItem } from "./schema";

/**
 * Parses a captured GUC page into typed items. Runs against `fixtures/_template/raw/`
 * in parser.test.ts, never against invented markup — see fixtures/_template/README.md
 * for how to capture the real thing with the in-app "Capture page" tool.
 */
export function parseTemplatePage(html: string, sourceUrl?: string): TemplateItem[] {
  const root = parse(html);
  const rows = root.querySelectorAll(".template-item");

  if (rows.length === 0) {
    throw new PortalError("PARSE_FAILED", "No .template-item rows found — page layout may have changed.", {
      sourceUrl,
    });
  }

  return rows.map((row, index) => {
    const item = { id: row.getAttribute("data-id") ?? String(index), title: row.text.trim() };
    return templateItemSchema.parse(item);
  });
}
