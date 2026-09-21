import { MailScreen } from "../../src/features/mail/screens/MailScreen";
import { FeatureErrorBoundary } from "../../src/core/ui";

export default function MailRoute() {
  return (
    <FeatureErrorBoundary featureId="mail">
      <MailScreen />
    </FeatureErrorBoundary>
  );
}
