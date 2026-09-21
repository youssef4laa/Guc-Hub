import { readFileSync } from "node:fs";
import { join } from "node:path";

import { PortalError } from "../../core/portal/PortalError";
import { parseCmsPage } from "./parser";

const fixture = readFileSync(join(__dirname, "../../../fixtures/cms/raw/list.html"), "utf8");

describe("parseCmsPage", () => {
  it("parses items out of a captured page", () => {
    const items = parseCmsPage(fixture);
    expect(items).toEqual([
      { id: "1", title: "Fake item one" },
      { id: "2", title: "Fake item two" },
    ]);
  });

  it("throws PARSE_FAILED, not a crash, when the layout changes", () => {
    expect(() => parseCmsPage("<html><body>nothing here</body></html>")).toThrow(PortalError);
  });
});
