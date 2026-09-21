import { Redirect } from "expo-router";

import { UiGalleryScreen } from "../../src/core/ui/gallery/UiGalleryScreen";

export default function DevUiRoute() {
  // Dev-build-only: absent in spirit (if not in bytes) from release builds — nobody
  // reaches it without knowing the URL, and it renders nothing outside __DEV__.
  if (!__DEV__) return <Redirect href="/" />;
  return <UiGalleryScreen />;
}
