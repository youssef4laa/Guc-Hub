# Guc Hub

An unofficial, student-built companion app for German University in Cairo (GUC)
students — mail + portal (schedule, grades, CMS, and more) in one app, for iOS and
Android from one codebase. **Unofficial**: not affiliated with GUC. Always verify
important things (grades, deadlines, exam rooms) on the official portal.

There is **no Guc Hub backend**. The app runs entirely on your phone and talks
directly to GUC's own servers with your own GUC credentials, which never leave your
device except to GUC's own hosts. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

This repository currently holds the **foundation**: core infrastructure, one fully
working reference feature (`auth` + `schedule`, in demo mode), and stubs for every
other planned feature. See [docs/ROADMAP.md](docs/ROADMAP.md) for what's real vs.
stubbed, and [docs/DISCOVERY.md](docs/DISCOVERY.md) for what's still unknown about
GUC's portals.

## Quickstart (5 minutes)

Requires Node 20+ and pnpm (`corepack enable && corepack prepare pnpm@latest --activate`,
or `npm install -g pnpm`).

```bash
pnpm install
cp .env.example .env.local   # defaults already run the app in demo mode
pnpm start
```

Press `i` for the iOS Simulator or `a` for an Android emulator. **iOS builds run in
the cloud via EAS** (`eas build --profile development --platform ios`) — you do not
need a Mac to build for iOS; you only need a Mac (or the iOS Simulator via Xcode) to
_run_ the resulting build locally, or you can install it via EAS's build link on a
real device. On first run, tap **Try demo** — the whole app runs on realistic fake
data, no GUC account required (this is also how App/Play Store reviewers use it).

> This app uses **development builds** (`expo-dev-client`), not Expo Go — native
> modules (secure storage, biometrics, background tasks) are required from day one.
> `pnpm start` starts the dev client automatically.

## Commands

```bash
pnpm start / ios / android / web
pnpm typecheck
pnpm lint          # pnpm lint:fix to auto-fix
pnpm test
pnpm e2e           # Maestro smoke flow, demo mode
pnpm gen:feature <name>     # scaffold a new feature from src/features/_template
pnpm gen:registry           # regenerate src/core/registry/registry.generated.ts
pnpm sanitize-fixture <path-to-captured.html>
```

## Docs

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — how the pieces fit together
- [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) — track ownership, PR rules, definition of done
- [docs/DISCOVERY.md](docs/DISCOVERY.md) — open questions about GUC's real portals
- [docs/ROADMAP.md](docs/ROADMAP.md) — feature phases and what's genuinely out of scope
- [docs/adr/](docs/adr/) — why the stack, credential model, and feature conventions are what they are

## License

See [LICENSE](LICENSE).
