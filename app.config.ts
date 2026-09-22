import type { ExpoConfig } from "expo/config";

// Plain require(), not import: Expo transpiles this file on the fly but doesn't
// register a TS loader for files it requires, so these are kept as .js — see the
// comment in config/plugins.shared.js.
/* eslint-disable @typescript-eslint/no-require-imports */
const sharedPlugins: NonNullable<ExpoConfig["plugins"]> = require("./config/plugins.shared");
const portalPlugins: NonNullable<ExpoConfig["plugins"]> = require("./config/plugins.portal");
const mailPlugins: NonNullable<ExpoConfig["plugins"]> = require("./config/plugins.mail");
/* eslint-enable @typescript-eslint/no-require-imports */

/**
 * Converted from app.json to app.config.ts so the plugins array can be composed
 * from three separately-owned files (see docs/PARALLEL_WORK.md) instead of being
 * one shared array both tracks would otherwise edit. Everything else here is
 * genuinely shared app metadata (name, bundle id, icons, ...) and is expected to
 * change rarely — see docs/CONTRIBUTING.md for the shared-change protocol.
 */
// `newArchEnabled` is a real, current Expo config key that @expo/config-types
// hasn't caught up to yet (it's valid in app.json, which isn't type-checked) —
// cast at the boundary instead of loosening the type for every field.
const config = {
  name: "Guc Hub",
  slug: "guc-hub",
  scheme: "guchub",
  version: "0.1.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  jsEngine: "hermes",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.guchub.app",
  },
  android: {
    package: "com.guchub.app",
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: [...sharedPlugins, ...portalPlugins, ...mailPlugins],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {},
    // Public identifier for the EAS project (@mokhalifa05/guc-hub), not a
    // secret — it ships inside every build. Written by hand because `eas init`
    // can't edit a dynamic config.
    eas: {
      projectId: "888f8a9a-3761-46db-a944-60077b98cf75",
    },
  },
};

export default config as ExpoConfig;
