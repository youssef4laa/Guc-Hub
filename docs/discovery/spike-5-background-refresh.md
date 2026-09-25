# Spike 5 — Background refresh and local notifications

**Owner:** Track B. **Blocks:** "next class changed" style notifications, and any
claim in the UI about being told when something happens.

Part of this spike is **answerable from the docs** and is answered below; the
remaining part genuinely needs a device left running for a week. The reminder
helpers this spike governs are implemented in `src/core/notifications/`.

## The question

With no backend — so no push — what can the app actually promise? Specifically:
how often does `expo-background-task` really run on iOS versus Android, and is
silent "your schedule changed" detection worth building on top of it?

## What the platforms guarantee (checked 2026-09-22)

- **`expo-background-task` uses `BGTaskScheduler` on iOS and `WorkManager` on
  Android.** The minimum interval defaults to 12 hours and can be lowered to 15
  minutes on Android. It is a _minimum delay_, not a schedule: the system weighs
  battery, network and the student's usage patterns, and defers accordingly.
  ([Expo docs: Background Task](https://docs.expo.dev/versions/v57.0.0/sdk/background-task/))
- **A task stops running if the app is force-quit** (swiped away in the app
  switcher on iOS), and resumes only after the app is next opened.
- **Background tasks do not run on the iOS simulator at all** — physical device
  only. `triggerTaskWorkerForTestingAsync()` triggers a run manually, but only in
  debug builds.
- **Local notifications are not guaranteed either.** The OS may decline to
  deliver them — Doze mode on Android is the documented example.
  ([Expo docs: Notifications](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/))
- **iOS keeps only the 64 soonest-firing local notification requests per app**
  and silently discards the rest. Every feature that schedules reminders is
  spending from that one budget.
  ([Apple Developer Forums: UNNotificationRequest scheduling limit](https://developer.apple.com/forums/thread/765490))
- **Android 13+ requires the student to grant notification permission**, and an
  exact-time trigger on Android 12+ needs the `SCHEDULE_EXACT_ALARM` permission
  in the manifest. We do **not** currently declare it, so our reminders are
  inexact on recent Android — fine for a "10 minutes before class" nudge, not
  fine if we ever promise to-the-minute timing.
- **Android 8+ shows nothing without a notification channel**, which
  `ensureReminderChannel()` now creates.

### What that means

1. **Silent "your schedule changed" detection is not worth building yet.** On
   iOS the refresh may not run for many hours, and not at all if the app was
   force-quit, so the student would learn about a room change long after it
   mattered. Building it would create a promise the platform doesn't keep.
2. **Reminders computed from already-downloaded data are worth building**, and
   are what `core/notifications` now does. A weekly timetable is known in
   advance, so the phone can schedule "10 minutes before CSEN 401" without any
   network or background execution at all. This is the reliable path.
3. **UI copy must never say "instant".** No "you'll be alerted when new mail
   arrives" — there is no push, and background refresh is opportunistic.

## What's implemented

In `src/core/notifications/` (Track B owns this; other features consume it):

- **`plan.ts`** — pure planning, no native imports, fully unit-tested:
  `planWeeklyReminders` (classes), `planDatedReminders` (exams, custom events),
  `nextWeeklyOccurrence`, and `limitReminders`, which sorts soonest-first and
  caps the count so iOS keeps the reminders that matter. Times resolve in **Cairo
  time**, not device time, and survive Egypt's summer-time change — a 09:00 class
  stays 09:00 in November.
- **`sync.ts`** — `syncReminders(prefix, reminders)`: asks for permission,
  creates the Android channel, cancels everything under the prefix, and
  schedules the plan. If permission is refused it clears the prefix and reports
  `permitted: false` rather than pretending to have scheduled anything.
- Features supply their own data and titles; `core/notifications` never imports a
  feature. Track A's `schedule` feature can adopt `planWeeklyReminders` in place
  of its own local `nextOccurrence` helper (which computes in device time, so it
  is off by an hour across the summer-time change) — that's a `needs-track-b`
  → `needs-track-a` hand-off, not something Track B should change unilaterally.

## What still needs a real device, and for a week

The measurement half of the spike, unchanged:

1. Build a dev client and install it on a **real iPhone** that gets normal daily
   use (the simulator cannot run background tasks).
2. Register a background task that appends `Date.now()` to an `AsyncStorage`
   array every time it fires, with `ensureBackgroundRefreshScheduled(15)`.
3. Leave it for about a week. Don't force-quit the app.
4. Read the timestamps back and record here: how many times it fired per day, the
   longest gap, and whether it ever fired while the app had been unused for a day.
5. Repeat on a **real Android device** — WorkManager is more generous, and the
   answer will differ.

Record the numbers in this file. If the longest iOS gap is measured in many
hours, treat point 1 above as settled: no silent change detection, and no UI copy
that implies it.

## Also worth deciding after the measurement

- Whether to declare `SCHEDULE_EXACT_ALARM` on Android (it needs a justification
  and can be revoked by the user) or to keep reminders inexact.
- How the 64-notification budget is divided between classes, exams and any future
  source. `DEFAULT_REMINDER_BUDGET` is currently 24 per feature, deliberately
  conservative.
