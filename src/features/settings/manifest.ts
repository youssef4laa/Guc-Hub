import type { FeatureManifest } from "../../core/registry/types";

// Not stubbed like the other phase-1+ features (see ADR-003): sign-out and the
// theme toggle need to exist for the app to be usable at all in demo mode, so this
// one is small but real from day one. Lives in "More", never the tab bar.
export const manifest: FeatureManifest = {
  id: "settings",
  title: "Settings",
  icon: "settings-outline",
  order: 100,
  showInTabBar: false,
  enabled: true,
  route: "/(tabs)/settings",
};
