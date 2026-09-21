import type { FeatureManifest } from "../../core/registry/types";

// Copy this whole _template folder (pnpm gen:feature <name> does it for you),
// rename this id/route, and flip `enabled` once the feature has real screens.
export const manifest: FeatureManifest = {
  id: "_template",
  title: "Template",
  icon: "cube-outline",
  order: 999,
  showInTabBar: false,
  enabled: false,
  route: "/(tabs)/_template",
};
