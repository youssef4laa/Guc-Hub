import { Redirect } from "expo-router";

import { CapturePageScreen } from "../../src/core/dev/CapturePageScreen";

export default function DevCaptureRoute() {
  if (!__DEV__) return <Redirect href="/" />;
  return <CapturePageScreen />;
}
