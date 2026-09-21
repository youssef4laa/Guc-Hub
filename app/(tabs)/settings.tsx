import { SettingsScreen } from "../../src/features/settings/screens/SettingsScreen";
import { FeatureErrorBoundary } from "../../src/core/ui";

export default function SettingsRoute() {
  return (
    <FeatureErrorBoundary featureId="settings">
      <SettingsScreen />
    </FeatureErrorBoundary>
  );
}
