#!/usr/bin/env bash
# Proves the conflict-proofing actually works: two branches simulate Track A
# and Track B doing a full slate of "hotspot" edits in parallel — a new
# feature, an i18n string, a host, a config plugin entry, an env var, a spike
# doc, an ADR, and a dependency — then get merged. Asserts zero conflicts
# outside pnpm-lock.yaml (which is *expected* to conflict and is resolved by
# regenerating it, per docs/PARALLEL_WORK.md's dependency protocol), and that
# typecheck/lint/test all pass on the merged result.
#
# Everything here is throwaway: separate git worktrees and branches, all
# removed on exit (success or failure). Never touches your real working tree.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [ -n "$(git status --porcelain)" ]; then
  echo "Working tree has uncommitted changes — commit or stash before rehearsing." >&2
  exit 1
fi

BASE_REF="$(git rev-parse HEAD)"
WORK_DIR="$(mktemp -d)"
BRANCH_A="rehearsal/a"
BRANCH_B="rehearsal/b"
BRANCH_MERGE="rehearsal/merge"

cleanup() {
  local status=$?
  echo
  echo "=== Cleaning up rehearsal branches/worktrees ==="
  git worktree remove --force "$WORK_DIR/a" 2>/dev/null || true
  git worktree remove --force "$WORK_DIR/b" 2>/dev/null || true
  git worktree remove --force "$WORK_DIR/merge" 2>/dev/null || true
  git branch -D "$BRANCH_A" "$BRANCH_B" "$BRANCH_MERGE" 2>/dev/null || true
  rm -rf "$WORK_DIR"
  if [ $status -eq 0 ]; then
    echo "Rehearsal PASSED."
  else
    echo "Rehearsal FAILED (exit $status)." >&2
  fi
  exit $status
}
trap cleanup EXIT

echo "=== Setting up worktree A (simulating Track A) ==="
git branch "$BRANCH_A" "$BASE_REF"
git worktree add -q "$WORK_DIR/a" "$BRANCH_A"

echo "=== Setting up worktree B (simulating Track B) ==="
git branch "$BRANCH_B" "$BASE_REF"
git worktree add -q "$WORK_DIR/b" "$BRANCH_B"

# --- Track A's simulated parallel work -------------------------------------
(
  cd "$WORK_DIR/a"
  echo "--- [A] pnpm gen:feature ---"
  node tools/gen-feature.js rehearsal-a-feature

  echo "--- [A] i18n string in its own namespace ---"
  node -e '
    const fs = require("fs");
    const p = "src/features/rehearsal-a-feature/i18n/en.json";
    const j = JSON.parse(fs.readFileSync(p, "utf8"));
    j["rehearsal-a-feature"].subtitle = "Added by Track A rehearsal";
    fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n");
  '

  echo "--- [A] host in its own hosts.ts ---"
  cat > src/features/rehearsal-a-feature/hosts.ts <<'EOF'
export const hosts: string[] = ["rehearsal-a.example.invalid"];
EOF

  echo "--- [A] config plugin entry in its own config file ---"
  node -e '
    const fs = require("fs");
    const p = "config/plugins.portal.js";
    let content = fs.readFileSync(p, "utf8");
    content = content.replace("module.exports = [];", "module.exports = [\"rehearsal-a-plugin\"];");
    fs.writeFileSync(p, content);
  '

  echo "--- [A] variable in its own .env.example block ---"
  printf '\nEXPO_PUBLIC_REHEARSAL_A=true\n' >> .env.example

  echo "--- [A] its own spike doc ---"
  cat > docs/discovery/spike-rehearsal-a.md <<'EOF'
# Spike — Rehearsal A

Throwaway spike doc added by tools/rehearse-parallel.sh to prove Track A can
add its own discovery doc without touching Track B's.
EOF

  echo "--- [A] its own ADR ---"
  cat > docs/adr/A-001-rehearsal.md <<'EOF'
# ADR A-001: Rehearsal

Throwaway ADR added by tools/rehearse-parallel.sh to prove Track A can add its
own ADR without colliding with Track B's numbering.
EOF

  echo "--- [A] one new dependency ---"
  pnpm add ms --ignore-scripts >/dev/null

  git add -A
  git commit -q -m "rehearsal: Track A parallel-work simulation"
)

# --- Track B's simulated parallel work -------------------------------------
(
  cd "$WORK_DIR/b"
  echo "--- [B] pnpm gen:feature ---"
  node tools/gen-feature.js rehearsal-b-feature

  echo "--- [B] i18n string in its own namespace ---"
  node -e '
    const fs = require("fs");
    const p = "src/features/rehearsal-b-feature/i18n/en.json";
    const j = JSON.parse(fs.readFileSync(p, "utf8"));
    j["rehearsal-b-feature"].subtitle = "Added by Track B rehearsal";
    fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n");
  '

  echo "--- [B] host in its own hosts.ts ---"
  cat > src/features/rehearsal-b-feature/hosts.ts <<'EOF'
export const hosts: string[] = ["rehearsal-b.example.invalid"];
EOF

  echo "--- [B] config plugin entry in its own config file ---"
  node -e '
    const fs = require("fs");
    const p = "config/plugins.mail.js";
    let content = fs.readFileSync(p, "utf8");
    content = content.replace("module.exports = [];", "module.exports = [\"rehearsal-b-plugin\"];");
    fs.writeFileSync(p, content);
  '

  echo "--- [B] variable in its own .env.example block ---"
  printf '\nEXPO_PUBLIC_REHEARSAL_B=true\n' >> .env.example

  echo "--- [B] its own spike doc ---"
  cat > docs/discovery/spike-rehearsal-b.md <<'EOF'
# Spike — Rehearsal B

Throwaway spike doc added by tools/rehearse-parallel.sh to prove Track B can
add its own discovery doc without touching Track A's.
EOF

  echo "--- [B] its own ADR ---"
  cat > docs/adr/B-001-rehearsal.md <<'EOF'
# ADR B-001: Rehearsal

Throwaway ADR added by tools/rehearse-parallel.sh to prove Track B can add its
own ADR without colliding with Track A's numbering.
EOF

  echo "--- [B] one new dependency ---"
  pnpm add nanoid --ignore-scripts >/dev/null

  git add -A
  git commit -q -m "rehearsal: Track B parallel-work simulation"
)

# --- Merge both into a scratch branch ---------------------------------------
echo "=== Merging A and B into a scratch branch ==="
git branch "$BRANCH_MERGE" "$BRANCH_A"
git worktree add -q "$WORK_DIR/merge" "$BRANCH_MERGE"

(
  cd "$WORK_DIR/merge"
  set +e
  git merge --no-edit "$BRANCH_B" >/tmp/rehearsal-merge.log 2>&1
  MERGE_STATUS=$?
  set -e

  UNMERGED=$(git diff --name-only --diff-filter=U || true)
  NON_LOCKFILE_CONFLICTS=$(echo "$UNMERGED" | grep -v '^pnpm-lock\.yaml$' | grep -v '^$' || true)

  echo "--- Merge log ---"
  cat /tmp/rehearsal-merge.log
  echo "--- Unmerged files ---"
  echo "${UNMERGED:-<none>}"

  if [ -n "$NON_LOCKFILE_CONFLICTS" ]; then
    echo "FAIL: conflicts outside pnpm-lock.yaml:" >&2
    echo "$NON_LOCKFILE_CONFLICTS" >&2
    exit 1
  fi

  if echo "$UNMERGED" | grep -q '^pnpm-lock\.yaml$'; then
    echo "--- pnpm-lock.yaml conflicted as expected — resolving per docs/PARALLEL_WORK.md ---"
    git checkout --theirs pnpm-lock.yaml
    git add pnpm-lock.yaml
  fi

  if [ $MERGE_STATUS -ne 0 ]; then
    git commit --no-edit -q
  fi

  echo "--- Regenerating lockfile from merged package.json ---"
  pnpm install --ignore-scripts >/dev/null

  echo "--- pnpm typecheck && pnpm lint && pnpm test ---"
  pnpm typecheck
  pnpm lint
  pnpm test
)

echo
echo "=== Rehearsal result: zero non-lockfile conflicts; typecheck/lint/test pass on the merge. ==="
