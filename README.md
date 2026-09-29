# Guc Hub

An unofficial, student-built companion app for German University in Cairo (GUC)
students — mail + portal (schedule, grades, CMS, and more) in one app, for iOS and
Android from one codebase.

> **Project status: finished as a portfolio project.** GUC has since released its
> own official app, so Guc Hub will not be released. The app runs end to end on
> **built-in demo data** (tap **Try demo**). It has **never been run against
> GUC's real servers**, and it is **not affiliated with GUC**. Do not enter real
> GUC credentials into a build of this app.

There is **no Guc Hub backend**. The app runs entirely on your phone and talks
directly to GUC's own servers with your own GUC credentials, which never leave your
device except to GUC's own hosts. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

This repository currently holds the **foundation**: core infrastructure, one fully
working reference feature (`auth` + `schedule`, in demo mode), and stubs for every
other planned feature. See [docs/ROADMAP.md](docs/ROADMAP.md) for what's real vs.
stubbed, and [docs/DISCOVERY.md](docs/DISCOVERY.md) for what's still unknown about
GUC's portals.

## Quickstart

Requires Node 20+ and pnpm (`corepack enable && corepack prepare pnpm@latest --activate`,
or `npm install -g pnpm`). This app uses **development builds**
(`expo-dev-client`), not Expo Go — native modules (secure storage, biometrics,
SQLite, background tasks) are required from day one, so the app needs to be
installed once per platform before `pnpm start` can load JS into it.

```bash
git clone https://github.com/youssef4laa/guc-hub.git && cd guc-hub
pnpm install
cp .env.example .env.local   # defaults already run the app in demo mode
```

### Android emulator

Requires Android Studio with an emulator (AVD) already created and bootable.

```bash
pnpm exec expo run:android
```

Builds the dev client with Gradle, installs it on whichever emulator/device `adb`
sees, and starts Metro. Subsequent runs: `pnpm start`, then press `a`.

### Physical Android phone

```bash
# Phone connected over USB with USB debugging enabled, or on the same Wi-Fi:
adb devices          # confirm the phone shows up
pnpm exec expo run:android --device
```

Or build a standalone APK in the cloud and install it without a cable:

```bash
npx eas-cli@latest build --profile development --platform android
# scan the QR code EAS prints, or open the build link on the phone, to install it
pnpm start            # then open the installed app and it connects to Metro
```

### iOS — via EAS (recommended; see "Known issue" below)

No Mac required to build. This produces a build for the **iOS Simulator**, no
Apple Developer account or code signing needed:

```bash
npx eas-cli@latest login          # once
npx eas-cli@latest build --profile development-simulator --platform ios
# when it finishes, drag the downloaded .app onto a booted Simulator, or:
npx eas-cli@latest build:run --profile development-simulator --platform ios --latest
pnpm start            # then open the installed app and it connects to Metro
```

For a **real iPhone** instead of the Simulator, you need a paid Apple Developer
account (for device registration/provisioning):

```bash
npx eas-cli@latest build --profile development --platform ios
# EAS walks you through registering the device the first time
```

### Known issue: local iOS builds (`expo run:ios`) are currently blocked

`expo-modules-jsi` (bundled with Expo SDK 57) declares `swift-tools-version: 6.2`
in its Swift Package Manager manifest, but Xcode 16.3 only ships Swift 6.1 —
`pod install` / `xcodebuild` fails with _"package 'apple' is using Swift tools
version 6.2.0 but the installed version is 6.1.0"_. This is a known upstream
issue: [expo/expo#50067](https://github.com/expo/expo/issues/50067). Until it's
resolved (or you have Xcode 16.4+ / a compatible newer Xcode installed), **build
iOS via EAS** (above) instead of `expo run:ios` on this machine. Android is
unaffected — `expo run:android` works locally today.

Once either platform's dev client is installed, tap **Try demo** on the login
screen — the whole app runs on realistic fake data, no GUC account required
(this is also how App/Play Store reviewers use it).

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

## Authors

- Youssef Alaa — [@youssef4laa](https://github.com/youssef4laa)
- [@mokhalifa9](https://github.com/mokhalifa9)

## License

MIT — see [LICENSE](LICENSE). `modules/guc-ntlm` vendors Apache HttpClient NTLM
classes under the Apache License 2.0 (see its `NOTICE`).
