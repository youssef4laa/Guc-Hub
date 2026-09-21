import type { PropsWithChildren } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "../theme";

export function Screen({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  const { theme } = useTheme();
  return (
    <SafeAreaView
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      edges={["top", "left", "right"]}
    >
      <View style={[styles.flex, { padding: theme.spacing.lg }, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
