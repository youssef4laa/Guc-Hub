import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useTheme } from "../theme";
import { Text } from "./Text";

/**
 * Network state is read from `expo-network` lazily so this file has no hard
 * dependency at import time in environments (e.g. certain test setups) where the
 * native module isn't mocked.
 */
export function OfflineBanner() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    import("expo-network").then((Network) => {
      if (!mounted) return;
      Network.getNetworkStateAsync().then((state) => setIsOffline(state.isConnected === false));
      const sub = Network.addNetworkStateListener?.((state) => setIsOffline(state.isConnected === false));
      unsubscribe = () => sub?.remove?.();
    });

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  if (!isOffline) return null;

  return (
    <View style={{ backgroundColor: theme.colors.warning, padding: theme.spacing.sm }}>
      <Text style={{ color: theme.colors.background, textAlign: "center" }} variant="caption">
        {t("common.offline")}
      </Text>
    </View>
  );
}
