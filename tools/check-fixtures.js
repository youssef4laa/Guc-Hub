#!/usr/bin/env node
/**
 * CI gate: fails the build if any committed fixture under fixtures/*&#47;raw/
 * contains a real-looking email address. Run by .github/workflows/ci.yml. Does not
 * scan raw.local/ (gitignored, never committed in the first place).
 */
const fs = require("fs");
const path = require("path");

const { containsRealLookingEmail } = require("./sanitizeHtml");

const ROOT = path.resolve(__dirname, "..");
const FIXTURES_DIR = path.join(ROOT, "fixtures");

function walk(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "raw.local") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walk(full));
    else if (entry.name.endsWith(".html")) results.push(full);
  }
  return results;
}

function main() {
  if (!fs.existsSync(FIXTURES_DIR)) return;

  const offenders = walk(FIXTURES_DIR).filter((file) =>
    containsRealLookingEmail(fs.readFileSync(file, "utf8")),
  );

  if (offenders.length > 0) {
    console.error("Found real-looking email addresses in committed fixtures:");
    for (const file of offenders) console.error(`  ${path.relative(ROOT, file)}`);
    console.error("\nRun `pnpm sanitize-fixture <file>` before committing a capture.");
    process.exit(1);
  }

  console.log("No real-looking emails found in committed fixtures.");
}

main();
