import { ExamsScreen } from "../../src/features/exams/screens/ExamsScreen";
import { FeatureErrorBoundary } from "../../src/core/ui";

export default function ExamsRoute() {
  return (
    <FeatureErrorBoundary featureId="exams">
      <ExamsScreen />
    </FeatureErrorBoundary>
  );
}
