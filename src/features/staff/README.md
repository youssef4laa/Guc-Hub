# `staff`

Owner: Track A (portal). Status: **built on demo data, enabled.**

Searchable staff directory with expandable office, office hours and an email action. All addresses use the reserved `.invalid` TLD.

## What is real and what is not

- The screen, store, schema (zod) and mock source are complete and unit-tested
  (`__tests__/store.test.ts`).
- There is **no live source**: `live.ts` throws `NOT_IMPLEMENTED`. No real GUC page
  for this feature was ever captured, so there is no parser either. The old
  placeholder parser and fixture were removed rather than kept as invented markup
  (see `docs/CONTRIBUTING.md`: never invent GUC HTML).
- All data comes from `mock.ts` and is fake.

## If someone picks this up

Capture a real page with the in-app "Capture page" tool, sanitize it with
`pnpm sanitize-fixture`, write `parser.ts` against it, and implement `live.ts`.
That work is gated on the discovery spikes in `docs/DISCOVERY.md`.
