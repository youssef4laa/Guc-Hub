import { useLocalSearchParams } from "expo-router";

import { WebViewScreen } from "../src/core/ui";

export default function WebViewRoute() {
  const { url } = useLocalSearchParams<{ url: string }>();
  return <WebViewScreen url={url} />;
}
