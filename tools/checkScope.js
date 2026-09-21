/**
 * Pure logic behind tools/check-scope.mjs, split out so it's directly
 * unit-testable (see checkScope.test.js) without needing an ESM-aware test
 * runner. .github/scope.json is the data this operates on.
 */

/** Converts one scope.json glob into a RegExp. Supports `**` (any path depth) and `*` (one segment). */
function globToRegExp(glob) {
  let pattern = "";
  for (let i = 0; i < glob.length; i++) {
    const char = glob[i];
    if (char === "*") {
      if (glob[i + 1] === "*") {
        pattern += ".*";
        i++;
      } else {
        pattern += "[^/]*";
      }
    } else if (".+^${}()|[]\\".includes(char)) {
      pattern += "\\" + char;
    } else {
      pattern += char;
    }
  }
  return new RegExp(`^${pattern}$`);
}

/** Returns the track name whose branchPrefixes match, or null (exempt — e.g. shared/, main). */
function determineTrack(branch, scope) {
  for (const [name, track] of Object.entries(scope.tracks)) {
    if (track.branchPrefixes.some((prefix) => branch.startsWith(prefix))) return name;
  }
  return null;
}

/**
 * @param {{branch: string, files: string[], crossTrack: boolean, scope: object}} params
 * @returns {{ok: boolean, track: string | null, violations: string[]}}
 */
function checkScope({ branch, files, crossTrack, scope }) {
  const trackName = determineTrack(branch, scope);
  if (!trackName) return { ok: true, track: null, violations: [] };
  if (crossTrack) return { ok: true, track: trackName, violations: [] };

  const patterns = scope.tracks[trackName].allow.map(globToRegExp);
  const violations = files.filter((file) => !patterns.some((re) => re.test(file)));
  return { ok: violations.length === 0, track: trackName, violations };
}

module.exports = { globToRegExp, determineTrack, checkScope };
