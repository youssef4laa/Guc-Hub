import fs from "node:fs";
import path from "node:path";

import { features } from "../registry.generated";

const ROOT = path.resolve(__dirname, "../../../..");

// The only feature ids these files are allowed to reference literally: "auth"
// (deliberately excluded from nav — see app/_layout.tsx) and "settings" (app
// chrome, not "content" — see MoreScreen.tsx). Everything else must come from
// the registry, never a string literal, or a new feature silently won't show
// up anywhere (or worse, an old removed one keeps a dead entry).
const ALLOWED_LITERAL_IDS = new Set(["auth", "settings"]);

const CHROME_FILES = ["app/(tabs)/_layout.tsx", "src/features/settings/screens/MoreScreen.tsx"];

const contentFeatureIds = features.map((f) => f.id).filter((id) => !ALLOWED_LITERAL_IDS.has(id));

describe("registry-driven nav chrome never hardcodes a feature id", () => {
  it.each(CHROME_FILES)("%s has no quoted content-feature-id literal", (relPath) => {
    const source = fs.readFileSync(path.join(ROOT, relPath), "utf8");

    const offenders = contentFeatureIds.filter((id) => new RegExp(`["'\`]${id}["'\`]`).test(source));

    expect(offenders).toEqual([]);
  });
});
