# Device test report

First run of the app on a device. Everything before this was written without an
emulator. Procedure: [DEVICE_CAPTURE.md](DEVICE_CAPTURE.md) and
[LOCAL_HANDOFF.md](LOCAL_HANDOFF.md). Screenshots: [screenshots/](screenshots/README.md).

All testing was in **demo mode** (`EXPO_PUBLIC_MODE=mock`, **Try demo**). No GUC
credentials were entered anywhere.

## Environment

| Item           | Value                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------- |
| Device         | Android Emulator AVD `Medium_Phone_API_36` (`sdk_gphone64_arm64`), 1080x2400, 420 dpi    |
| OS             | Android 16 (API 36), Google APIs arm64 image                                             |
| Emulator       | 35.4.9.0                                                                                 |
| Host           | macOS (Darwin 27.0.0), Apple silicon                                                     |
| Build          | `expo run:android` dev client, `com.guchub.app`; Expo SDK 57, React Native 0.86.3        |
| Toolchain      | Gradle 9.3.1, JDK 21 (the brief says 17; the build worked), Node and pnpm as in the repo |
| iOS            | **Not run.** Xcode 16.3 is installed and the brief needs 16.4+                           |
| Before testing | `pnpm typecheck`, `pnpm lint` (one warning in `core/i18n`) and `pnpm test` (252) passed  |

The app cold-started to the login screen on the first build with no native fixes
needed: the `guc-ntlm` module, the config plugins and the Android build all worked.

## Smoke checklist

| #   | Item                                        | Result           | Notes                                                                                                                                                                                                                 |
| --- | ------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Cold start reaches login, no red/yellow box | Pass             | Dev client's floating tools button was switched off for captures.                                                                                                                                                     |
| 2   | Try demo, every feature opens and scrolls   | Pass             | Schedule, Grades, CMS tabs; Exams, Attendance, Staff, Transcript, Evaluations, Glide from More. More lists every feature, including the tab ones, by design.                                                          |
| 3   | Force-quit and reopen                       | Pass             | Returns cleanly to login (the demo session is not restored). Biometric unlock never came up. Glide's best score did survive.                                                                                          |
| 4   | Light, dark, system theme                   | Pass after fixes | Two bugs found and fixed (status bar, stack header). HTML emails stay on a white page in dark mode on purpose (the WebView is hard-coded white).                                                                      |
| 5   | Rotate; tablet size                         | Pass             | The app is locked to portrait (`app.config.ts`), so rotating does nothing. No tablet AVD exists, so a 1600x2560 / 280 dpi display was emulated on the same AVD: Mail goes two-pane and other screens stretch cleanly. |
| 6   | Local reminders                             | **Fail, fixed**  | See bug 4. After the fix the permission prompt appears and 5 alarms are scheduled (`dumpsys alarm`). **Firing was not observed**: the next class is Sunday and the emulator has no root to move its clock.            |
| 7   | Sign out clears the demo session            | Pass             | Back at login, and still at login after a force-quit.                                                                                                                                                                 |
| 8   | Glide                                       | Pass             | Taps flap, pipes scroll, a collision ends the run, best score survives a force-quit. Smoothness was judged by eye on the screen recording, not profiled.                                                              |
| 9   | Mail                                        | Pass after fixes | See bugs 5 to 7. Open, compose, keyboard in compose, attach, swipe-delete with undo and multi-select all work. Sending was not pressed.                                                                               |
| 10  | Logs                                        | Pass             | No `guc.edu.eg` in logcat or the Metro log, no credential text, no JS warnings or errors.                                                                                                                             |
| -   | Maestro `pnpm e2e`                          | **Not run**      | The Maestro CLI is not installed on this machine. `.maestro/demo-smoke.yaml` asserts "Coming soon" on More, which stops being true once Mail is enabled, so the flow needs that line removed first.                   |
| -   | Evaluations **Submit all**                  | **Not run**      | Not pressed during the run, so the "All caught up" state was not captured.                                                                                                                                            |

## Mail decision

Mail was enabled locally for testing (`enabled: true` in
`src/features/mail/manifest.ts`) and all the flows above work once the fixes below are
in. Committing the flip, and updating the README table and `docs/roadmap/track-b.md`,
is a separate step: see the pull request description. The Mail screenshots
(`13*`) and the five-tab bar in the other shots were captured with Mail enabled.

## Bugs found

Each fix is its own commit on this branch.

| #   | Where                                                         | Symptom                                                                                                                        | Cause and fix                                                                                                                                                               | Commit    |
| --- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 1   | Every screen, light theme, Android                            | The status bar clock and icons are invisible (white on white).                                                                 | `expo-status-bar` was installed but never rendered. `app/_layout.tsx` now renders `StatusBar` from the resolved theme.                                                      | `5b3099e` |
| 2   | Error states (`ErrorState`), UI gallery                       | A session-expired or portal-unavailable error is headed "Retry". The gallery has no `PARSE_FAILED` example.                    | Both messages mapped to `common.retry`. Added real strings and a `PARSE_FAILED` gallery section.                                                                            | `ead41f5` |
| 3   | Stack screens with a header (UI gallery, webview), dark theme | A white header over a dark body.                                                                                               | Header colours were never themed. `app/_layout.tsx` sets `headerStyle`, `headerTintColor` and `headerTitleStyle`.                                                           | `1292730` |
| 4   | Schedule reminders                                            | On Android 13+ no reminder can ever show: the notification permission was never requested.                                     | `rescheduleClassReminders` called `scheduleReminder` directly and skipped `syncReminders` (permission, channel, budget). It now plans with `planWeeklyReminders` and syncs. | `e5156b4` |
| 5   | Mail, opening any HTML message                                | **The app crashes** (process abort, `RawValue.h castValue: assertion failed (value.isObject())`). Text-only messages are fine. | `dataDetectorTypes="none"` on the WebView is an iOS-only prop and aborts the Android Fabric view. Found by bisecting props; now passed on iOS only.                         | `9f64be7` |
| 6   | Mail, folder and sort chips                                   | The bottom of each pill is cut off.                                                                                            | The horizontal ScrollViews were sized without their vertical padding. `minHeight: 44` on both.                                                                              | `3ed8276` |
| 7   | Mail, message previews                                        | Words from neighbouring HTML blocks run together ("campusRobotics").                                                           | `textContent` joins block elements without a gap. A space is now inserted before block tags, with a test.                                                                   | `e00f451` |
| 8   | Repo                                                          | `modules/guc-ntlm/android/build/` shows up as untracked after an Android build.                                                | Added to `.gitignore`.                                                                                                                                                      | `d8b2f2d` |

## Other observations (not fixed)

- Glide's "Game over / Tap to play again" text sits over the lower pipe and is hard to
  read in light theme.
- The login screen stretches to the full width on a tablet-size display.
- The Android dev client puts a floating tools button on every screen; turn it off in
  its menu before capturing.
- A cold start in a dev build shows a blank screen for 20 to 30 s while Metro bundles.
- `npx expo install --check` reports a few patch-version mismatches (`expo-router`,
  `expo-sharing`, `expo-sqlite`, `expo-task-manager`, `@types/jest`, `jest`). They were
  left alone.

## How the captures were made

Android demo-mode status bar, `cmd uimode night yes|no` for the theme,
`adb exec-out screencap -p` for stills, and `adb shell screenrecord` plus ffmpeg
(720 px wide, 12 fps, 3 MB) for `demo.gif`. Glide's mid-run frames came from a small
script that reads screenshots and taps the screen, since a human cannot flap on cue
through adb.
