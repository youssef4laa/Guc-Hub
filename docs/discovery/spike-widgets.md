# Spike — Home-screen widgets

**Owner:** Track B. **Blocks:** the home-screen widget feature (phase 3, see
[docs/roadmap/track-b.md](../roadmap/track-b.md)).

**Status: researched, not prototyped.** No native code has been written or
merged. The findings below were checked on 2026-09-22 against the SDK this repo
actually uses (`expo@~57.0.24`); re-check them before starting, because the iOS
story is moving quickly.

## The question

What does it actually cost to ship a home-screen widget from this app — on iOS
(WidgetKit) and Android (Glance / App Widget) — given Continuous Native
Generation, EAS Build, and the fact that a widget runs in its own process and
cannot run our React Native code?

## What's true today

### iOS: Expo now has a first-party answer

`expo-widgets` exists and is published on the SDK 57 line (`57.0.20`, matching
our `expo@~57.0.24`), so it installs with `npx expo install expo-widgets` and is
configured by its own config plugin — no hand-managed Xcode target.
([Expo docs: Widgets](https://docs.expo.dev/versions/v57.0.0/sdk/widgets/),
[Expo blog: home screen widgets and Live Activities](https://expo.dev/blog/home-screen-widgets-and-live-activities-in-expo))

What that means in practice:

- Widgets are declared in the config plugin (name, display name, description,
  `ios.supportedFamilies` including Lock Screen accessories).
- Widget UI is written with `@expo/ui/swift-ui` components inside a component
  marked `'widget'`. That code runs in an **isolated runtime**: no React hooks,
  no async work, no references to anything outside it.
- Data reaches the widget as **props**, pushed from the app with
  `updateSnapshot()` / `updateTimeline()`. Images have to be written into the
  shared `widgetsDirectory`.
- It is **alpha** — Expo says APIs may still change, and images were listed as
  not yet supported at announcement.
- Not available in Expo Go; needs a development build.
- Interactive and configurable widgets need iOS 17+.

The older route, [`@bacons/apple-targets`](https://github.com/EvanBacon/expo-apple-targets),
is still viable and is what Expo's own how-to article uses: it generates a real
WidgetKit target, you write Swift/SwiftUI directly, and data is shared through an
App Group with `ExtensionStorage`.
([Expo blog: how to implement iOS widgets](https://expo.dev/blog/how-to-implement-ios-widgets-in-expo-apps))
It is more work and more native surface, but it is not alpha and it has no
restrictions on what SwiftUI you can write.

### Android: no first-party support

Expo's widget support is iOS-only today. The two realistic routes are:

1. **[`react-native-android-widget`](https://saleksovski.github.io/react-native-android-widget/)**
   (`0.22.1`) — ships an Expo config plugin, declares widgets in `app.config`,
   generates the widget classes, and renders through a task handler. Automatic
   updates are bounded by Android's own `updatePeriodMillis`, **minimum 30
   minutes**. Requires a dev-client rebuild.
2. **A hand-written Glance widget behind our own config plugin** — more control,
   and no third-party dependency to track, but we own the Kotlin and the plugin.

### Build cost, for both platforms

- Any of these is a **native dependency**: everyone rebuilds their dev client.
  Per `docs/PARALLEL_WORK.md` that means announcing it first and landing it in
  its own `shared/deps-<name>` PR.
- Config plugins do the Xcode/Gradle work during prebuild, and EAS Build handles
  the extra signing an app extension needs — but an App Group entitlement on a
  **real iPhone** still needs a paid Apple Developer account. Simulator builds
  are fine without one.
- Swift/Kotlin changes have no hot reload; each one is a rebuild.

## The part that actually matters for this app

A widget cannot call our providers, our SQLite cache, or any JavaScript. It can
only render data the app has already handed it. That interacts with two things we
already know:

- **There is no backend**, so nothing can push a widget an update.
- **Background refresh is opportunistic at best** (see
  [spike 5](spike-5-background-refresh.md)).

The good news is that "next class" doesn't need either. A weekly schedule changes
rarely, so the app can hand WidgetKit a **timeline** covering the next day or
week whenever it's opened, and iOS will render the right entry at the right time
with no further work, no network, and no background execution. The widget stays
correct even if the app isn't opened for days; it only goes stale if the
timetable itself changes.

**Cross-track question to settle before any of this is built:** the "next class"
data belongs to Track A's `schedule` feature, while the widget belongs to Track
B (`native/widgets/**`), and features may not import each other. So publishing a
widget snapshot needs a small shared surface — something like a
`core/widgets`-level `publishSnapshot(key, data)` that any feature can call and
the widget layer reads. That is a `shared/` design discussion, not something
either track should invent alone. The same applies to a future "unread mail
count" widget, which would come from Track B's own feature.

## Recommendation

1. **First widget: "Next class", iOS only, via `expo-widgets`**, fed by a
   timeline built from the already-cached schedule. Smallest useful thing, no new
   network path, no background execution, and it degrades honestly.
2. **Android second**, via `react-native-android-widget`, once the iOS one has
   proven the data path. Accept the 30-minute floor — with a timeline-style
   snapshot it doesn't matter much.
3. **If `expo-widgets` alpha churn bites**, fall back to `@bacons/apple-targets`
   and plain WidgetKit. The data path (snapshot written by the app, read by the
   widget) is the same either way, so that decision is reversible.
4. **Do not start until the snapshot API is agreed** with Track A, and until the
   owner approves the native dependency.

## How to prototype, when approved

- Start in a **throwaway Expo project**, not this repo: `npx create-expo-app
--example with-widgets`, build it for the simulator, confirm what EAS Build
  does with the extension target.
- Then bring it in under `native/widgets/**`, with the plugin entry in
  `config/plugins.mail.js` (Track B's file — never `plugins.shared.js`).
- Record the decision as `docs/adr/B-00N-widgets.md`.
