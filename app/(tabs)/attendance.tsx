import { AttendanceScreen } from "../../src/features/attendance/screens/AttendanceScreen";
import { FeatureErrorBoundary } from "../../src/core/ui";

export default function AttendanceRoute() {
  return (
    <FeatureErrorBoundary featureId="attendance">
      <AttendanceScreen />
    </FeatureErrorBoundary>
  );
}
