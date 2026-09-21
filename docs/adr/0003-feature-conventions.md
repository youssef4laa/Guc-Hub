# ADR-003: Feature conventions

## Status

Accepted

## Context

Two developers need to build features in parallel without a shared file both of
them edit turning into a merge-conflict machine, and without one feature's bug
taking down another's screen.

## Decision

- **Every feature is a self-contained folder** under `src/features/<id>/`:
  `manifest.ts`, `schema.ts`, `source.ts`/`live.ts`/`mock.ts`, `parser.ts` +
  `parser.test.ts`, `store.ts`, `screens/`, `components/`, `README.md`. Copy
  `src/features/_template/` (or run `pnpm gen:feature <name>`) rather than
  reinventing the shape each time.
- **No central file every feature must edit.** `tools/gen-registry.js` transpiles
  every `manifest.ts` (using the TypeScript compiler API directly, no bundler) and
  writes the gitignored `src/core/registry/registry.generated.ts`. The tab bar,
  "More" menu, and settings list are all _generated_ from that data. This is the
  fallback path the foundation prompt allowed (Metro's `require.context` isn't
  available outside Expo Router's own internal use); if a future Expo/Metro version
  adds general `require.context` support, this could be revisited, but the codegen
  script has the advantage of working today and being trivially testable in
  isolation (`tools/gen-registry.js` has no RN/Metro dependency at all).
- **Cross-feature imports are forbidden**, enforced by the `boundaries/dependencies`
  ESLint rule: a feature may import `core/` and its own subtree, never another
  feature's files. If two features need the same thing, that thing belongs in
  `core/`.
- **Each feature owns its local SQLite migrations** (declared in its own folder;
  `core/storage/migrations.ts` just runs whatever list it's given, merged and
  sorted). There is no shared schema file to conflict over.
- **A uniform `PortalError` codes every failure**, and `core/ui/ErrorState.tsx` is
  the one place that turns a code into UI copy. Every module must degrade
  gracefully — cached data if any, a `PARSE_FAILED` state with "Open original page",
  never a crash.

## Deviations from the template (and why)

- **`auth`** has no `source.ts`/`live.ts`/`mock.ts`/`parser.ts` — there's no page to
  parse, just a login form. More significantly, its session state
  (`AuthProvider`/`useAuth`, the `PortalSession` singleton, `selectLoginStrategy`)
  lives in **`core/portal`**, not in `src/features/auth/`. Session state is
  cross-cutting in the same way theme and the query client are (which is why
  `core/theme` and `core/query` already export React providers/hooks despite being
  "core") — `settings` needs `logout()`, the root layout needs `isAuthenticated`.
  Keeping it in the `auth` feature folder would have forced `settings` to import
  from another feature, which the boundaries rule (correctly) rejects. `auth`'s
  folder now owns only `LoginScreen`/`LoginForm`/`schema.ts` (form validation) and
  consumes `core/portal`'s `useAuth()` like any other feature would.
- **`settings`** is real, not a stub, despite not being called out with its own
  phase in `docs/ROADMAP.md`. Sign-out and the theme toggle are load-bearing for the
  app to be usable at all in demo mode (there is no other way to sign out or change
  theme), so stubbing it and immediately un-stubbing it in phase 1 would have been
  pure churn. Everything else it might eventually own (notification preferences,
  cache clearing) is genuinely deferred.

## Consequences

- A new feature never requires a PR that touches someone else's track's files,
  except the one-line `app/(tabs)/<id>.tsx` route file (which itself never needs to
  change again after creation) and the initial `.github/CODEOWNERS` line.
- Reviewers can trust that a diff confined to `src/features/<id>/` cannot have
  broken another feature, because the type system and ESLint both enforce it.
