import { WebView } from "react-native-webview";

import { Screen } from "./Screen";

/**
 * The universal "Open original page" fallback for any feature's PARSE_FAILED state
 * (see ErrorState.tsx). Renders the real GUC page so the student can still get their
 * data even when our parser is broken or not written yet.
 */
export function WebViewScreen({ url }: { url: string }) {
  return (
    <Screen style={{ padding: 0 }}>
      <WebView source={{ uri: url }} startInLoadingState style={{ flex: 1 }} />
    </Screen>
  );
}
