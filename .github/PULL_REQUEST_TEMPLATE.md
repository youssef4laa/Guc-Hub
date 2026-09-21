## What & why

<!-- One or two sentences. Link the issue/spike this closes, if any. -->

## Feature definition of done

_(Delete this section if the PR isn't shipping/updating a feature.)_

- [ ] Schema defined and exported from `schema.ts`
- [ ] Mock source returns realistic (but fake) data
- [ ] Live source parses at least one real, sanitized fixture, with a passing test —
      or is an honest `NOT_IMPLEMENTED` stub with the blocking spike named in the README
- [ ] Loading / empty / error / `PARSE_FAILED` states all render
- [ ] `PARSE_FAILED` offers "Open original page"
- [ ] iOS **and** Android screenshots, light **and** dark (attach below)
- [ ] Screen-reader labels on interactive elements
- [ ] `manifest.enabled` flipped to `true` if this feature is now ready

## Screenshots

|         | Light | Dark |
| ------- | ----- | ---- |
| iOS     |       |      |
| Android |       |      |

## Checklist

- [ ] `pnpm typecheck && pnpm lint && pnpm test` pass locally
- [ ] No real credentials or unsanitized captures committed
- [ ] No invented GUC URLs/selectors/HTML presented as real (stubs say so honestly)
- [ ] Touches only my track's feature folder(s), or has review from the other track
