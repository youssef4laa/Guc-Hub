import { GradesScreen } from "../../src/features/grades/screens/GradesScreen";
import { FeatureErrorBoundary } from "../../src/core/ui";

export default function GradesRoute() {
  return (
    <FeatureErrorBoundary featureId="grades">
      <GradesScreen />
    </FeatureErrorBoundary>
  );
}
