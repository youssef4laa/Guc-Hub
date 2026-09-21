# ADR S-001: Stack

## Status

Accepted

## Context

Guc Hub needs one codebase for iOS and Android, no backend, offline-first reads,
and HTML parsing that runs entirely on-device. Two developers need to work in
parallel without a shared server to coordinate through.

## Decision

- **React Native + Expo (latest stable SDK), TypeScript strict, Expo Router.**
  Development builds (`expo-dev-client`) from day one, not Expo Go — native modules
  (secure store, biometrics, background tasks, SQLite) are needed immediately, and
  the auth spike may need a custom native module later. iOS builds run in the cloud
  via EAS Build, so the Android developer does not need a Mac.
- **TanStack Query + a persisted cache**, so every screen renders instantly from
  cache and revalidates in the background (stale-then-refresh). `expo-sqlite` for
  user-owned local data (custom events, course weights, CMS seen-state, mail cache);
  `zod` for every feature's schema.
- **`node-html-parser`** for HTML parsing (see "HTML parser" below).
- **`pnpm`** as the package manager (fast, strict node_modules, good workspace
  story if this ever needs one — it doesn't yet, single package).
- **Jest (`jest-expo`)** for unit/parser tests, **Maestro** for e2e smoke in demo
  mode, **ESLint (flat config, `eslint-config-expo`) + Prettier + Husky/lint-staged**
  for hygiene, **GitHub Actions** for CI.

## HTML parser: `node-html-parser` over `cheerio` or `htmlparser2`

Parsing runs in Hermes (React Native's JS engine), not Node or a browser. `cheerio`
wants jQuery-like DOM traversal APIs that assume a fuller DOM implementation than
Hermes provides without polyfills; `htmlparser2` is a lower-level SAX-style parser
that works but pushes more parsing logic into every feature's `parser.ts`.
`node-html-parser` gives CSS-selector querying (`querySelector`/`querySelectorAll`)
directly on top of a lightweight tree, with no Hermes polyfills needed, which is the
best fit for "many small feature-owned parsers, all doing similar selector-based
extraction." Confirmed as DISCOVERY Spike 4; revisit only if a specific captured
page needs a selector this library can't express.

## Consequences

- No monorepo — there's no backend to separate a shared package from, so a single
  Expo app package is simplest. Revisit only if a future opt-in service (e.g. the
  Flappy leaderboard backend) needs shared TypeScript types.
- Development builds mean `pnpm start` always needs `expo-dev-client`, not Expo Go
  — slightly more setup for a new contributor, documented in the README quickstart.
