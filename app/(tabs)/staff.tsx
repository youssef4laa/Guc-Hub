import { StaffScreen } from "../../src/features/staff/screens/StaffScreen";
import { FeatureErrorBoundary } from "../../src/core/ui";

export default function StaffRoute() {
  return (
    <FeatureErrorBoundary featureId="staff">
      <StaffScreen />
    </FeatureErrorBoundary>
  );
}
