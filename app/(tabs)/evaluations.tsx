import { EvaluationsScreen } from "../../src/features/evaluations/screens/EvaluationsScreen";
import { FeatureErrorBoundary } from "../../src/core/ui";

export default function EvaluationsRoute() {
  return (
    <FeatureErrorBoundary featureId="evaluations">
      <EvaluationsScreen />
    </FeatureErrorBoundary>
  );
}
