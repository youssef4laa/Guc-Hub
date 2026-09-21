import type { FeatureManifest } from "../../core/registry/types";

export const manifest: FeatureManifest = {
  id: "schedule",
  title: "Schedule",
  icon: "calendar-outline",
  order: 1,
  showInTabBar: true,
  enabled: true,
  route: "/(tabs)/schedule",
};
