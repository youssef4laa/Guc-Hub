# Working in parallel

Two people, two coding agents, one repo, no backend, weeks of unsupervised
parallel work. This document — plus `.github/scope.json` and
`.github/CODEOWNERS`, which encode the same ownership mechanically — is the
source of truth both agents read before touching a file outside their own
feature folder. If this file and the code ever disagree, fix the code (or this
file) in a `shared/` PR; don't just pick whichever is more convenient that day.

## What we found (the hotspot audit)

Before this change, these files would have been edited by both tracks sooner
or later, causing merge conflicts or silent stomping:

| Hotspot                                          | Confirmed?                                                                                           | Fix                                                                                                       |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| i18n locale file (`core/i18n/en.json`)           | Yes — one shared file with every feature's strings                                                   | Per-feature `i18n/en.json`, merged by codegen                                                             |
| Allowed-hosts list (`core/http/config.ts`)       | Yes — hardcoded both env var reads                                                                   | Per-feature `hosts.ts`, aggregated by codegen                                                             |
| Expo config plugins (`app.json`)                 | Yes — one plugins array                                                                              | `app.config.ts` composing `config/plugins.{shared,portal,mail}.js`                                        |
| `.env.example`                                   | Yes — flat list, no ownership                                                                        | Reserved SHARED/TRACK A/TRACK B blocks                                                                    |
| `package.json` / `pnpm-lock.yaml`                | Yes, inherently (any dependency touches both)                                                        | Dependency protocol below; lockfile conflicts resolved by regenerating, never hand-edited                 |
| `docs/DISCOVERY.md`                              | Yes — one file, six spikes, two owners                                                               | Index + one file per spike under `docs/discovery/`                                                        |
| `docs/ROADMAP.md`                                | Yes — one table, two owners                                                                          | Index (shared rows only) + `docs/roadmap/track-{a,b}.md`                                                  |
| ADR numbering (`docs/adr/000N-*.md`)             | Yes — a single incrementing counter                                                                  | Track-prefixed `S-00N` / `A-00N` / `B-00N`                                                                |
| SQLite migrations (`core/storage/migrations.ts`) | Yes — a single global `PRAGMA user_version` counter both tracks would pick numbers against           | Per-feature `(feature_id, version)` tracking table; each feature numbers its own migrations independently |
| `app/(tabs)/_layout.tsx` / More screen           | **Not actually a hotspot** — already generated from the manifest registry, no hardcoded feature list | Added a regression test (`no-hardcoded-features.test.ts`) so it stays that way                            |
| `eas.json`                                       | Confirmed low-risk — profiles are independent objects, adding one rarely conflicts with another      | No structural change; still shared, see below                                                             |
| Feature registry (`registry.generated.ts`)       | **Not a hotspot** — already gitignored/generated, not committed                                      | No change needed                                                                                          |

## Ownership matrix

Also encoded in `.github/scope.json` (machine-readable, read by the CI scope
guard) and `.github/CODEOWNERS` (GitHub-enforced review requirement).

### Track A — Portal (branch prefix `portal/`)

Owner: `@youssef4laa`.

- `src/features/{schedule,grades,transcript,cms,exams,attendance,staff,evaluations}/**`
- Their route files under `app/(tabs)/{schedule,grades,transcript,cms,exams,attendance,staff,evaluations}.tsx`
- `fixtures/{schedule,grades,transcript,cms,exams,attendance,staff,evaluations}/**`
- `src/core/portal/**`
- `src/core/portal/ntlm/**` — the NTLM transport (ADR A-001). Track A edits, Track B also reviews (required, not just invited), since mail's EWS provider depends on it and this is also where an author-can't-approve-their-own-PR bind would otherwise block every solo Track A change here
- `modules/guc-ntlm/**` — the NTLM native module (ADR A-001). Track A edits, Track B reviews, since mail's EWS provider depends on it
- `src/core/http/**` — Track A edits, Track B reviews (it's shared infrastructure, but Track A is currently the one driving its real implementation via Spike 1/3)
- `config/plugins.portal.js`
- `docs/discovery/spike-{1,3,4,6}*.md`
- `docs/roadmap/track-a.md`
- `docs/adr/A-*`

### Track B — Mail & Experience (branch prefixes `mail/`, `exp/`)

Owner: `@mokhalifa9`.

- `src/features/{mail,flappy,settings}/**`
- Their route files under `app/(tabs)/{mail,flappy,settings}.tsx`, plus `app/(tabs)/more.tsx`
- `fixtures/{mail,flappy}/**`
- `src/core/{ui,theme,notifications}/**`
- `native/widgets/**` (doesn't exist yet — created when the widgets spike lands)
- `config/plugins.mail.js`
- `docs/discovery/spike-{2,5,widgets}*.md`
- `docs/roadmap/track-b.md`
- `docs/adr/B-*`

### Shared (branch prefix `shared/`)

Both review.

- `src/core/{storage,query,i18n}/**` — engine only (i18next setup, TanStack Query
  client, SQLite migration runner); the _content_ inside each (per-feature
  `i18n/en.json`, per-feature `migrations.ts`) belongs to whichever feature
  owns it, not to whoever last touched the engine
- `app/_layout.tsx`, `app/index.tsx`, `app/login.tsx`, `app/webview.tsx`, `app/dev/**`
- `app/(tabs)/_layout.tsx` — generated from the registry; a structural change
  here (not a content change) is shared
- Root configs: `package.json`, `tsconfig.json`, `eslint.config.js`, `eas.json`,
  `app.config.ts`, `config/plugins.shared.js`, `.env.example` (its block
  structure, not its per-track values), `.prettierrc.json`
- `.github/**`
- `tools/**`
- `README.md`, `docs/PARALLEL_WORK.md`, `docs/ARCHITECTURE.md`, `docs/CONTRIBUTING.md`
- `docs/adr/S-*`

## Git workflow

- Trunk-based. Branches: `portal/<topic>`, `mail/<topic>`, `exp/<topic>`,
  `shared/<topic>`.
- PRs under ~400 lines. Squash merge. Conventional commit titles.
- **No branch lives longer than 2 days.** Rebase on `origin/main` at least
  daily: `git fetch && git rebase origin/main`. Use `--force-with-lease` only
  on your own branch — never on `main` or the other track's branch.
- Merge unfinished work behind `manifest.enabled: false` so branches stay
  short — "not done" ships as a disabled feature, not a long-lived branch.

## Shared-change protocol

A change in a shared path goes in its own small `shared/` PR (under ~150
lines), announced to the other developer before you open it, reviewed by them
the same day, and merged before either track's dependent work continues. Don't
bundle a shared-path change into a feature PR — it makes the feature PR harder
to review and blocks it on a review it didn't need.

## Dependency protocol

- Add a dependency in its own `shared/deps-<name>` PR, merged immediately (not
  bundled with feature code).
- Adding a **native** module (anything needing `expo prebuild` / a new native
  dependency) means everyone rebuilds their dev client — announce it before
  merging, not after.
- **Lockfile conflicts:** never hand-edit `pnpm-lock.yaml`. On a conflict, take
  `main`'s version and re-run `pnpm install`:
  ```bash
  git checkout --theirs pnpm-lock.yaml   # or: git checkout origin/main -- pnpm-lock.yaml
  pnpm install
  git add pnpm-lock.yaml
  ```
  We deliberately did **not** add a `.gitattributes` merge driver (e.g.
  `merge=ours`) for the lockfile — that silently drops one side's real
  dependency additions instead of surfacing the conflict, which is worse than
  the conflict itself.

## Cross-track requests

Need something from the other track's files? Open a GitHub issue labeled
`needs-track-a` or `needs-track-b` instead of editing their files directly. If
you need a new UI primitive that belongs in `core/ui`, build it inside your own
feature's `components/` first and propose promoting it later — don't add it to
`core/ui` unilaterally, since that's Track B's reviewed territory.

A PR that must touch the other track's files for a good reason gets the
`cross-track` label, which the scope guard (below) treats as an explicit
override.

## Session/credentials boundary

`src/features/mail/` keeps its own session/transport internal to itself. It
may **read** stored credentials only through `core/portal`'s public API
(`useAuth`, not `PortalSession` directly) and must not modify `core/portal` or
`core/http`. If mail turns out to need a non-HTTP transport (raw TCP for
IMAP/SMTP — see Spike 2), that transport must apply the same host-allowlist
discipline as `core/http` internally, and be tested the same way
(`aggregateHosts.test.ts` is the pattern to follow).

## Human actions (GitHub, not code)

- [x] Fill in `@FRIEND_HANDLE` in `.github/CODEOWNERS` and `.github/scope.json`
      with the real GitHub handle (`@mokhalifa9`).
- [x] Add that person as a repo collaborator.
- [x] Protect `main`: require a PR, require CI to pass, disallow force
      pushes and deletions, 1 required approving review. **Not** "require
      review from code owners" — with a two-person team and GitHub already
      refusing to let a PR's author approve their own PR, "1 approval" is
      already "the other person reviewed it," without needing every
      CODEOWNERS line to list both of us (see #13/#17's threads for why
      the code-owner-enforced version deadlocks on solo-track PRs).
      CODEOWNERS still auto-requests the right reviewer either way.
- [ ] Create labels `needs-track-a`, `needs-track-b`, `cross-track`.
- [ ] Add CI secrets if/when wanted: `EXPO_TOKEN` (EAS builds),
      `MAESTRO_CLOUD_API_KEY` (Maestro Cloud smoke run) — both jobs skip
      cleanly without them (see `.github/workflows/ci.yml`).
