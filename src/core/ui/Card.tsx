import type { PropsWithChildren } from "react";
import { View, type ViewStyle } from "react-native";

import { useTheme } from "../theme";

export function Card({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radii.lg,
          padding: theme.spacing.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
