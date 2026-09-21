import { notImplemented } from "../../core/portal/PortalError";
import type { ClassSession } from "./schema";

/**
 * STUB. We have never seen the real GUC schedule page, so there is nothing to parse
 * yet — inventing selectors here would be worse than not having a parser at all
 * (see AGENTS-facing rule in docs/CONTRIBUTING.md: "never invent portal HTML").
 *
 * To make this real:
 *   1. Run the in-app "Capture page" dev tool against the real schedule page.
 *   2. `pnpm sanitize-fixture` the result into fixtures/schedule/raw/.
 *   3. Replace this function's body with real parsing, using node-html-parser
 *      (see src/features/_template/parser.ts for the pattern), and add
 *      fixture-backed tests to parser.test.ts.
 */
export function parseSchedulePage(_html: string, sourceUrl?: string): ClassSession[] {
  notImplemented("schedule", sourceUrl);
}
