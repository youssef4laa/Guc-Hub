# Spike — Home-screen widgets

**Owner:** Track B. **Blocks:** the home-screen widget feature (phase 3, see
[docs/roadmap/track-b.md](../roadmap/track-b.md)).

**Question:** What's the actual setup cost for a WidgetKit (iOS) extension and a
Glance (Android) widget in an Expo/EAS project — native project changes needed,
whether a config plugin can automate them, and what data the widget can read
(it runs in a separate process from the app, so it needs its own read path into
whatever "next class" / "unseen mail count" data is shared with it).

**Why it matters:** widgets are the one phase-3 feature that's likely to need
real native/Xcode-project-level work (an app extension target), not just a
config plugin — worth spiking the setup cost before committing to a phase-3
date.

**How to find out:** Prototype a static (no live data) widget extension in a
throwaway Expo project first, using `expo-apple-targets` or a manual
`expo-dev-client` + native target modification, and see what breaks EAS Build.
Not blocked on anything else — can run any time.

Feasibility only, no need to wait on Track A.
