import { Redirect } from "expo-router";

import { AuthProbeScreen } from "../../src/core/portal/dev/AuthProbeScreen";

export default function DevAuthProbeRoute() {
  if (!__DEV__) return <Redirect href="/" />;
  return <AuthProbeScreen />;
}
