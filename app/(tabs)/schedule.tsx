import { ScheduleScreen } from "../../src/features/schedule/screens/ScheduleScreen";
import { FeatureErrorBoundary } from "../../src/core/ui";

export default function ScheduleRoute() {
  return (
    <FeatureErrorBoundary featureId="schedule">
      <ScheduleScreen />
    </FeatureErrorBoundary>
  );
}
