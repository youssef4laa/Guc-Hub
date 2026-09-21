import { FlappyScreen } from "../../src/features/flappy/screens/FlappyScreen";
import { FeatureErrorBoundary } from "../../src/core/ui";

export default function FlappyRoute() {
  return (
    <FeatureErrorBoundary featureId="flappy">
      <FlappyScreen />
    </FeatureErrorBoundary>
  );
}
