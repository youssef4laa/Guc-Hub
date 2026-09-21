/**
 * Every feature exports exactly one of these from its `manifest.ts`. The registry
 * generator (tools/gen-registry.js) collects them into `registry.generated.ts` — the
 * only place that knows about every feature. Nothing else should.
 */
export interface FeatureManifest {
  /** Must match the feature's folder name under src/features/. */
  id: string;
  title: string;
  /** Name from @expo/vector-icons Ionicons, used in the tab bar / More menu. */
  icon: string;
  /** Lower sorts first in the tab bar and the More list. */
  order: number;
  showInTabBar: boolean;
  /** false = stub phase; shows in "More" as "coming soon" instead of a live tab. */
  enabled: boolean;
  /** Expo Router path, e.g. "/(tabs)/schedule". */
  route: string;
}
