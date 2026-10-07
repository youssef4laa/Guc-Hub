# Local handoff plan: finish Guc Hub on a machine with an emulator

For the agent (or person) running on the authors' own machine, with Android Studio
and/or Xcode. The cloud session that wrote the features had no emulator, so
**nothing in this repo has ever been run on a device**. Your job is to prove it
works, capture the showcase assets, and land them.

Read first: [DEVICE_CAPTURE.md](DEVICE_CAPTURE.md) holds the exact setup commands,
the screen list, and the smoke checklist. This file is the order of work and the
decisions you must make. Do not enter real GUC credentials anywhere, ever.

## 0. Get the code

```bash
git clone https://github.com/youssef4laa/Guc-Hub.git && cd Guc-Hub
git checkout claude/app-wrap-up-plan-cvvh2k      # PR #19, until it is merged
pnpm install && cp .env.example .env.local        # keep EXPO_PUBLIC_MODE=mock
pnpm typecheck && pnpm lint && pnpm test          # expect 252 tests passing
```

If PR #19 is already merged, work from `main` on a new branch
`chore/device-capture`.

## 1. Build and boot (Android first)

`pnpm exec expo run:android`, then tap **Try demo**. iOS is optional; see the
Xcode 16.4+ / EAS note in DEVICE_CAPTURE.md.

**Stop and fix first** if the app does not cold-start to the login screen. Likely
trouble spots, since none of this has run: the native NTLM module
(`modules/guc-ntlm`), the config plugins in `config/`, and the scene-lifecycle
setting for iOS. Fix on a separate branch, in small commits.

## 2. Smoke-test, in this order

Work through the checklist in DEVICE_CAPTURE.md. These items were written but
never executed, so check them carefully and record pass or fail for each:

| Area         | What to look for                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------------------ |
| Tab bar      | Schedule, Grades, CMS appear as tabs. Everything else is under **More**                                            |
| Each feature | Exams, Attendance, Staff, Transcript, Evaluations, Glide all open and scroll                                       |
| Glide        | `requestAnimationFrame` loop is smooth, taps flap, collision ends the run, best score survives a force-quit        |
| Theme        | Colour-coded grade/attendance text is readable in dark mode                                                        |
| Staff        | Search box with the keyboard open, **Email** button opens a mail app                                               |
| Reminders    | A class reminder from Schedule fires (grant notification permission)                                               |
| Maestro      | `pnpm e2e` (`.maestro/demo-smoke.yaml`). The extended flow is unrun, so a failure may be a bad flow, not a bad app |
| Logs         | No credential text, and no calls to `guc.edu.eg` hosts in demo mode                                                |

Fix small bugs you find (layout, a wrong label, a Maestro text mismatch) and commit
each separately. Anything large: write it up in the report instead.

## 3. Decide on Mail

Mail ships disabled (`enabled: false` in `src/features/mail/manifest.ts`) because
it has never run on a device. Set it to `true` locally and drive it: open a
message, compose, attach a file, swipe-delete and undo, multi-select, and try the
keyboard in compose (the layout most likely to be wrong).

- **All works:** commit the flip, and update the README table and
  `docs/roadmap/track-b.md` from "disabled" to "built".
- **Anything crashes:** leave it disabled and record exactly what failed in the
  report. That is a fine outcome for a portfolio project.

## 4. Capture the assets

Follow DEVICE_CAPTURE.md ("Capture setup" and "Screens to capture"). Produce:

- `docs/screenshots/<android|ios>/<light|dark>/<NN>-<name>.png`
- `docs/screenshots/demo.gif` (under 8 MB)
- `docs/screenshots/README.md`, an index of the files

Every screenshot must show only the built-in fake data. If any real-looking name,
email or `guc.edu.eg` value appears, file it as a bug against that feature's
`mock.ts`.

## 5. Write the report

`docs/DEVICE_TEST_REPORT.md`: device model and OS, AVD/Xcode versions, the pass/fail
result for every checklist item, bugs found (file, screen, repro steps), and
whether Mail was enabled.

## 6. Put the gallery in the README

In `README.md`, replace the `<!-- SCREENSHOTS ... -->` comment with a light/dark
gallery that links the files under `docs/screenshots/` (six to eight of the best
shots plus the GIF). Keep the "demo data" wording honest.

## 7. Land it

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm check-fixtures
git add -A && git commit        # conventional commits; screenshots in their own commit
git push
```

Open a PR (or push to the existing branch). CI may need the `cross-track` label
because the changes span both tracks.

## 8. Things only a human can do (GitHub UI)

- Set the repo description and topics: `expo`, `react-native`, `typescript`,
  `expo-router`, `student-project`.
- Upload a social-preview image (one of the screenshots works).
- Pin the repo on both authors' profiles.
- Optionally tag `v0.1.0`, and decide whether to archive the repo. Building an APK
  with `eas build --profile preview` uses EAS credits, so ask the owner first.

## Definition of done

- App cold-starts and every enabled feature works in demo mode on Android (and iOS
  if available), in light and dark.
- `docs/screenshots/`, `docs/DEVICE_TEST_REPORT.md` and the README gallery are
  committed.
- Typecheck, lint, tests and `check-fixtures` pass, and CI is green.
- Mail is either enabled and verified, or left disabled with the reason recorded.
