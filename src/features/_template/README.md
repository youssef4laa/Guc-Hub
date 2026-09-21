# `_template`

Not a real feature — the copy-me starting point for a new one. `pnpm gen:feature <name>`
copies this folder, renames the manifest id/route, and touches nothing else.

## Files

- `manifest.ts` — tab bar / registry metadata. No runtime imports allowed (the
  registry generator transpiles and executes this file directly, outside Metro).
- `schema.ts` — the feature's zod schema. Cross-feature imports of this are forbidden
  by the ESLint boundaries rule; go through `core/` if you truly need to share a type.
- `source.ts` / `live.ts` / `mock.ts` — the live/mock seam. `source.ts` picks between
  them based on demo mode; screens only ever call `getXSource()`, never `live`/`mock`
  directly.
- `parser.ts` + `parser.test.ts` — turns captured HTML into typed data. Tested against
  `fixtures/<feature>/raw/*.html`, never against invented markup.
- `store.ts` — TanStack Query hooks.
- `screens/`, `components/` — UI.

## Definition of done (copy into your PR)

- [ ] Schema defined and exported
- [ ] Mock source returns realistic fake data
- [ ] Live source parses at least one real (sanitized) fixture, with a passing test
- [ ] Loading / empty / error / `PARSE_FAILED` states all render
- [ ] `PARSE_FAILED` offers "Open original page"
- [ ] iOS + Android screenshots, light + dark
- [ ] Screen-reader labels on interactive elements
- [ ] `manifest.enabled` flipped to `true`
