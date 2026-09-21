import { readFileSync } from "node:fs";
import { join } from "node:path";

import { PortalError } from "../../core/portal/PortalError";
import { parseStaffPage } from "./parser";

const fixture = readFileSync(join(__dirname, "../../../fixtures/staff/raw/list.html"), "utf8");

describe("parseStaffPage", () => {
  it("parses items out of a captured page", () => {
    const items = parseStaffPage(fixture);
    expect(items).toEqual([
      { id: "1", title: "Fake item one" },
      { id: "2", title: "Fake item two" },
    ]);
  });

  it("throws PARSE_FAILED, not a crash, when the layout changes", () => {
    expect(() => parseStaffPage("<html><body>nothing here</body></html>")).toThrow(PortalError);
  });
});
