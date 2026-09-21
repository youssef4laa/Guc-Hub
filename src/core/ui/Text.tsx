import { Text as RNText, type TextProps as RNTextProps } from "react-native";

import { useTheme } from "../theme";
import { typography } from "../theme/tokens";

type Variant = keyof typeof typography;

export interface TextProps extends RNTextProps {
  variant?: Variant;
  color?: "default" | "muted" | "primary" | "danger";
}

export function Text({ variant = "body", color = "default", style, ...props }: TextProps) {
  const { theme } = useTheme();
  const colorMap = {
    default: theme.colors.text,
    muted: theme.colors.textMuted,
    primary: theme.colors.primary,
    danger: theme.colors.danger,
  };

  return <RNText {...props} style={[typography[variant], { color: colorMap[color] }, style]} />;
}
