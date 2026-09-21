import * as Haptics from "expo-haptics";
import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from "react-native";

import { useTheme } from "../theme";
import { Text } from "./Text";

export interface ButtonProps extends Omit<PressableProps, "style"> {
  label: string;
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
}

export function Button({ label, variant = "primary", loading, disabled, onPress, ...props }: ButtonProps) {
  const { theme } = useTheme();

  const backgrounds = {
    primary: theme.colors.primary,
    secondary: theme.colors.surface,
    ghost: "transparent",
  };
  const textColors: Record<string, "primary" | "default"> = {
    primary: "primary",
    secondary: "default",
    ghost: "primary",
  };

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={(event) => {
        void Haptics.selectionAsync();
        onPress?.(event);
      }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: backgrounds[variant],
          borderColor: theme.colors.border,
          borderWidth: variant === "secondary" ? StyleSheet.hairlineWidth : 0,
          opacity: pressed || disabled ? 0.6 : 1,
          minHeight: 44,
        },
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? theme.colors.onPrimary : theme.colors.primary} />
      ) : (
        <Text
          variant="body"
          color={variant === "primary" ? "default" : textColors[variant]}
          style={
            variant === "primary"
              ? { color: theme.colors.onPrimary, fontWeight: "600" }
              : { fontWeight: "600" }
          }
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
