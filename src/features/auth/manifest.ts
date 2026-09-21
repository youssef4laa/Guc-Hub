import type { FeatureManifest } from "../../core/registry/types";

// Not a tab: the root layout redirects to this route whenever there's no session.
// Excluded from the "More" menu by id in app/_layout.tsx (see the comment there) —
// it would never be reachable once signed in anyway.
export const manifest: FeatureManifest = {
  id: "auth",
  title: "Sign in",
  icon: "log-in-outline",
  order: 0,
  showInTabBar: false,
  enabled: true,
  route: "/login",
};
