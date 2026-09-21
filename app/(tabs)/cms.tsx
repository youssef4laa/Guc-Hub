import { CmsScreen } from "../../src/features/cms/screens/CmsScreen";
import { FeatureErrorBoundary } from "../../src/core/ui";

export default function CmsRoute() {
  return (
    <FeatureErrorBoundary featureId="cms">
      <CmsScreen />
    </FeatureErrorBoundary>
  );
}
