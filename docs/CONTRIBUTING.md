# Contributing

Two people, two tracks, one repo, no backend. This document is the rulebook that
makes that work without a PM refereeing every PR.

## Tracks

| Track                    | Owner          | Owns                                                                                                                            |
| ------------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **A: Portal**            | `@youssef4laa` | `schedule`, `grades`, `transcript`, `cms`, `exams`, `attendance`, `staff`, `evaluations`; the login strategies in `core/portal` |
| **B: Mail & Experience** | `@mokhalifa9`  | `mail`, `flappy`, `settings`; `core/ui`, `core/notifications`, theming, widgets, offline                                        |

**Shared** (needs review from both): `core/http`, `core/storage`, `core/query`,
`app/_layout.tsx` and other root `app/` files, root configs (`package.json`,
`tsconfig.json`, `eslint.config.js`, `.env.example`), CI.

## Ground rules

- Trunk-based development. Branch names: `feat/<feature>-<thing>`,
  `fix/<feature>-<thing>`, `chore/<thing>`.
- Keep PRs under ~400 lines where you can. Squash merge. Conventional commit titles
  (`feat:`, `fix:`, `chore:`, `docs:`, ...).
- CI (typecheck, lint, test, Maestro smoke, EAS build) must be green before merge.
- Touch the other track's feature folder only through a PR they review. A schema
  change to someone else's feature goes in its own small PR, reviewed by that
  feature's owner, before anything builds on it.
- **Never commit real credentials or an unsanitized capture.** Run
  `pnpm sanitize-fixture` on anything the "Capture page" dev tool exports before it
  goes in `fixtures/<feature>/raw/`. CI fails the build if a committed fixture
  contains a real-looking GUC email address (`*@*.guc.edu.eg`-shaped or similar).
- **Never invent GUC URLs, selectors, or HTML structure.** If you haven't seen the
  real page, write the stub (`throw notImplemented(...)`) and document what's needed
  in the feature's README and, if it's a new unknown, in `docs/DISCOVERY.md`. Code
  that _looks_ like it parses a real page but was guessed is worse than an honest
  stub — it fails silently instead of loudly.
- Never disable TLS verification. Never add a host to the allowlist "temporarily."

## Adding a feature

```bash
pnpm gen:feature <name>
```

This copies `src/features/_template` into `src/features/<name>` with identifiers
renamed, and a matching `fixtures/<name>/` folder. You still need to:

1. Add `app/(tabs)/<name>.tsx` — a thin re-export of your screen, wrapped in
   `FeatureErrorBoundary` (copy an existing route file's shape).
2. Fill in `manifest.ts` (icon, order, `showInTabBar`).
3. Everything else is scoped to your feature's own folder. `pnpm gen:registry` (or
   just `pnpm start`, which runs it for you) picks it up automatically — you never
   edit a shared route table, tab list, or "More" menu by hand.

## Definition of done (copy into your PR description)

- [ ] Schema defined and exported from `schema.ts`
- [ ] Mock source returns realistic (but fake) data
- [ ] Live source parses at least one real, sanitized fixture, with a passing test —
      or is an honest `NOT_IMPLEMENTED` stub with the blocking spike named in the README
- [ ] Loading / empty / error / `PARSE_FAILED` states all render
- [ ] `PARSE_FAILED` offers "Open original page"
- [ ] iOS **and** Android screenshots, light **and** dark
- [ ] Screen-reader labels (`accessibilityLabel`/`accessibilityRole`) on interactive
      elements
- [ ] `manifest.enabled` flipped to `true` once the above are done

## Local commands

```bash
pnpm start          # dev client, demo mode by default
pnpm typecheck
pnpm lint
pnpm test
pnpm e2e             # Maestro smoke flow, demo mode
pnpm gen:feature <name>
pnpm gen:registry
pnpm sanitize-fixture <path-to-captured.html>
```
