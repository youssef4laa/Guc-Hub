# Device capture and smoke-test brief

A self-contained brief for whoever (a person or an agent) has an Android and/or iOS
emulator: run the app in demo mode, smoke-test it, and capture the screenshots and
GIF the README needs. **No GUC credentials are ever needed or allowed** — demo mode
runs entirely on built-in fake data.

Deliverables go back into this repo (see the end).

## Machine requirements

- **Android (required):** Node 20+, pnpm 9.15 (`corepack enable`), JDK 17, the
  Android SDK with platform-tools (`adb` on PATH) and one bootable AVD (Pixel-class,
  API 34+, 1080x2400, Google APIs image). Verify with `adb devices`.
- **iOS (optional, macOS only):** Xcode **16.4+** and a booted iPhone Simulator.
  Xcode 16.3 fails `expo run:ios` on the Swift 6.2 tools-version issue
  ([expo/expo#50067](https://github.com/expo/expo/issues/50067)). With an older
  Xcode, or off a Mac, build via EAS instead:
  `npx eas-cli@latest build --profile development-simulator --platform ios`, then
  `npx eas-cli@latest build:run --profile development-simulator --platform ios --latest`.
  That needs an Expo login but no Apple Developer account.
- About 15 GB free disk for Gradle and the emulator. Network is only needed for the
  first install.

## Build and launch (demo mode)

1. `pnpm install && cp .env.example .env.local`. Keep `EXPO_PUBLIC_MODE=mock` and
   `EXPO_PUBLIC_PORTAL_AUTH_STRATEGY=mock`.
2. Android: `pnpm exec expo run:android` (dev client, package `com.guchub.app`).
   Later runs: `pnpm start`, then press `a`.
3. On the login screen tap **Try demo**. Do not type real GUC credentials anywhere.
4. Optional fast pass: `pnpm e2e` (Maestro, `.maestro/demo-smoke.yaml`). The flow
   was written but never executed, so treat a failure as a possible flow bug and
   check by hand before filing an app bug.

## Capture setup (for consistent shots)

- **Android status bar:** `adb shell settings put global sysui_demo_allowed 1`, then
  `adb shell am broadcast -a com.android.systemui.demo -e command enter`, and
  `... -e command clock -e hhmm 0941`, `... -e command battery -e level 100 -e plugged false`,
  `... -e command network -e wifi show -e level 4`,
  `... -e command notifications -e visible false`. Leave with `-e command exit`.
- **iOS status bar:**
  `xcrun simctl status_bar booted override --time 9:41 --batteryState charged --batteryLevel 100 --cellularBars 4 --wifiBars 3`.
- **Theme:** `adb shell "cmd uimode night yes"` / `no`, and
  `xcrun simctl ui booted appearance dark` / `light`. Also try the in-app override
  under **More > Settings**.
- **Capture:** `adb exec-out screencap -p > out.png` and
  `xcrun simctl io booted screenshot out.png`. Video: `adb shell screenrecord` and
  `xcrun simctl io booted recordVideo`, then convert to a GIF with ffmpeg
  (720px wide, 12 fps, under 8 MB).
- Let animations and skeleton loaders settle before each shot. Scroll lists so the
  first screen shows a full, varied set of rows.

## Screens to capture

Each screen in light and dark, on each platform. Save as
`docs/screenshots/<platform>/<theme>/<NN>-<name>.png` (for example
`android/dark/03-grades.png`) and write `docs/screenshots/README.md` as an index.

| #   | Screen                 | What must be visibly populated                                        |
| --- | ---------------------- | --------------------------------------------------------------------- |
| 01  | Login (before demo)    | Unofficial notice and the **Try demo** button                         |
| 02  | Schedule               | Classes across several days and the "Next class" card                 |
| 03  | Grades                 | Colour-coded courses, semester average; one card expanded             |
| 04  | CMS                    | Courses, files by type, unseen-count badge; one filter selected       |
| 05  | Exams                  | Upcoming exams with countdowns, plus a dimmed past exam               |
| 06  | Attendance             | Ok, warning and over-the-limit courses                                |
| 07  | Transcript             | Cumulative GPA, terms grouped by year; a year filter selected         |
| 08  | Staff                  | Search box and one expanded person                                    |
| 09  | Evaluations            | Ratings filled in, and the "All caught up" state after Submit all     |
| 10  | Glide                  | Ready screen, a mid-run frame, and the game-over screen with a best   |
| 11  | More and Settings      | The feature list (Mail shows "Coming soon"), theme, sign out          |
| 12  | UI gallery (dev only)  | Error, empty and `PARSE_FAILED` states, via **Settings > UI gallery** |
| 13  | Mail (only if enabled) | Inbox, reading view, compose with an attachment chip                  |

**Data rule:** everything shown must be the built-in fake data. No real names, IDs,
emails or `guc.edu.eg` accounts may appear in any capture. If a real-looking value
shows up, file it as a bug against that feature's `mock.ts`.

## Smoke checklist (report pass or fail per item, with a screenshot for each failure)

1. Cold start reaches the login screen with no red box or yellow box.
2. **Try demo** reaches the tab bar. Every enabled feature opens and scrolls without
   a crash: Schedule, Grades and CMS as tabs, and Exams, Attendance, Staff,
   Transcript, Evaluations and Glide from **More**.
3. Force-quit and reopen: the demo session restores (or returns cleanly to login),
   and biometric unlock is skipped or works.
4. Light, dark and system theme all render with readable contrast.
5. Rotate once, and try a tablet-size AVD once: the layout does not break.
6. Local reminders: from Schedule, confirm a class reminder is scheduled and fires
   (grant notification permission first).
7. Sign out returns to login and clears the demo session.
8. Glide: taps flap, pipes scroll, a collision ends the run, the best score survives
   a force-quit.
9. **Mail:** it ships disabled (`enabled: false` in `src/features/mail/manifest.ts`)
   because it has never run on a device. Set it to `true` locally and drive it:
   open a message, compose, attach a file, swipe-delete and undo, multi-select.
   If everything works, commit the flip and capture screen 13. If anything crashes,
   leave it disabled and record the failure in the report.
10. `adb logcat` or the Metro log shows no credential text and no network calls to
    `guc.edu.eg` hosts while in demo mode.

## Deliverables back to the repo

- The screenshot tree above, a demo GIF (`docs/screenshots/demo.gif`) and
  `docs/screenshots/README.md`.
- `docs/DEVICE_TEST_REPORT.md`: device model and OS, the Xcode/AVD versions, the
  checklist results, and a list of any bugs found (file, screen, repro steps).
- Bug fixes go on a separate branch or PR from the captures, in small commits.
