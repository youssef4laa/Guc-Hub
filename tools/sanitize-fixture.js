#!/usr/bin/env node
/**
 * pnpm sanitize-fixture <input.html> [output.html]
 *
 * Turns a raw capture from the in-app "Capture page" dev tool (which lands in
 * fixtures/<feature>/raw.local/, gitignored) into something safe to commit to
 * fixtures/<feature>/raw/. Always skim the output yourself afterwards — this
 * strips emails/IDs/tokens by pattern, not names in free text.
 */
const fs = require("fs");
const path = require("path");

const { sanitizeHtml } = require("./sanitizeHtml");

function main() {
  const [inputPath, outputPathArg] = process.argv.slice(2);
  if (!inputPath) {
    console.error("Usage: pnpm sanitize-fixture <input.html> [output.html]");
    process.exit(1);
  }

  const resolvedInput = path.resolve(inputPath);
  const html = fs.readFileSync(resolvedInput, "utf8");
  const sanitized = sanitizeHtml(html);

  const outputPath = outputPathArg
    ? path.resolve(outputPathArg)
    : resolvedInput.replace(`${path.sep}raw.local${path.sep}`, `${path.sep}raw${path.sep}`);

  if (outputPath === resolvedInput) {
    console.error("Refusing to overwrite the raw.local capture in place — pass an output path.");
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, sanitized);
  console.log(`Sanitized -> ${path.relative(process.cwd(), outputPath)}`);
  console.log(
    "Skim the file yourself before committing — this catches emails/IDs/tokens, not free-text names.",
  );
}

main();
