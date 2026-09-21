import { TranscriptScreen } from "../../src/features/transcript/screens/TranscriptScreen";
import { FeatureErrorBoundary } from "../../src/core/ui";

export default function TranscriptRoute() {
  return (
    <FeatureErrorBoundary featureId="transcript">
      <TranscriptScreen />
    </FeatureErrorBoundary>
  );
}
