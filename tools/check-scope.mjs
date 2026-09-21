#!/usr/bin/env node
/**
 * CI scope guard. Derives the track from the PR's head branch prefix, reads
 * .github/scope.json, and fails if any changed file falls outside that
 * track's allowed globs — unless the PR carries the `cross-track` label.
 *
 * Usage: node tools/check-scope.mjs --branch <name> --files <a,b,c> [--cross-track]
 * (See .github/workflows/ci.yml for how CI supplies these.)
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { checkScope } from "./checkScope.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs(argv) {
  const args = { files: [], crossTrack: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--branch") args.branch = argv[++i];
    else if (argv[i] === "--files") args.files = argv[++i].split(",").filter(Boolean);
    else if (argv[i] === "--cross-track") args.crossTrack = true;
  }
  return args;
}

function main() {
  const { branch, files, crossTrack } = parseArgs(process.argv.slice(2));
  if (!branch) {
    console.error("Usage: check-scope.mjs --branch <name> --files <a,b,c> [--cross-track]");
    process.exit(1);
  }

  const scope = JSON.parse(readFileSync(path.join(ROOT, ".github/scope.json"), "utf8"));
  const result = checkScope({ branch, files, crossTrack, scope });

  if (!result.track) {
    console.log(`[check-scope] "${branch}" isn't a scoped track branch (portal/, mail/, exp/) — skipping.`);
    return;
  }

  if (result.ok) {
    console.log(`[check-scope] All ${files.length} changed file(s) are within Track ${result.track}'s scope.`);
    return;
  }

  console.error(`[check-scope] Branch "${branch}" (Track ${result.track}) touches files outside its scope:`);
  for (const file of result.violations) console.error(`  ${file}`);
  console.error(
    "\nEither move this change to its own scoped PR, or add the 'cross-track' label — see docs/PARALLEL_WORK.md.",
  );
  process.exit(1);
}

main();
