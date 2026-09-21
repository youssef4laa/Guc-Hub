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
];
