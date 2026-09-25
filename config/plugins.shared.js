/**
 * Core infrastructure plugins — shared by both tracks. Edits here need review
 * from both (see docs/PARALLEL_WORK.md). Track-specific native config goes in
 * plugins.portal.js / plugins.mail.js instead, never here.
 *
 * Plain .js (not .ts): app.config.ts is transpiled on the fly by Expo, but Expo
 * doesn't register a TS loader for the files IT requires, so a nested .ts import
 * fails to resolve. .js needs no loader at all.
 */
module.exports = [
  "expo-router",
  "expo-secure-store",
  "expo-sqlite",
  [
    "expo-local-authentication",
    {
      faceIDPermission: "Guc Hub uses Face ID to unlock your saved GUC password.",
    },
  ],
  [
    "expo-notifications",
    {
      icon: "./assets/icon.png",
    },
  ],
  "expo-background-task",
  "expo-sharing",
  "expo-splash-screen",
  [
    // iOS 27's SDK refuses to launch an app that still uses the old
    // UIApplicationDelegate lifecycle (iOS 26 only warned). SDK 57 ships the
    // scene runtime but keeps it behind this flag; SDK 58 turns it on by
    // default, at which point this entry becomes a no-op and can be dropped.
    //
    // Known caveat while on SDK 57: with scenes enabled,
    // Linking.getInitialURL() resolves to null on a cold start, so a deep link
    // that launches the app from scratch is lost. Fixed in SDK 58. We have no
    // external deep-link entry points today, but anything that adds one needs
    // to read the URL from the scene connection options instead.
    "expo-build-properties",
    {
      ios: { enableSceneSupport: true },
    },
  ],
];
