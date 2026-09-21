import { readFileSync } from "node:fs";
import { join } from "node:path";

import { PortalError } from "../../core/portal/PortalError";
import { parseMailPage } from "./parser";

const fixture = readFileSync(join(__dirname, "../../../fixtures/mail/raw/list.html"), "utf8");

describe("parseMailPage", () => {
  it("parses items out of a captured page", () => {
    const items = parseMailPage(fixture);
    expect(items).toEqual([
      { id: "1", title: "Fake item one" },
      { id: "2", title: "Fake item two" },
    ]);
  });

  it("throws PARSE_FAILED, not a crash, when the layout changes", () => {
    expect(() => parseMailPage("<html><body>nothing here</body></html>")).toThrow(PortalError);
  });
});
