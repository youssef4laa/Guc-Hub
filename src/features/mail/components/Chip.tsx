import { Pressable } from "react-native";

import { useTheme } from "../../../core/theme";
import { Text } from "../../../core/ui";

/**
 * Small selectable pill used by the folder and sort bars. Kept inside the mail
 * feature for now — if another feature wants one, it gets promoted to core/ui in
 * its own PR (docs/PARALLEL_WORK.md, "Cross-track requests").
 */
export function Chip({
  label,
  selected,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  const { theme } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: theme.spacing.xs + 2,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.radii.pill,
        borderWidth: 1,
        borderColor: selected ? theme.colors.primary : theme.colors.border,
        backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
        opacity: pressed ? 0.7 : 1,
        minHeight: 36,
        justifyContent: "center",
      })}
    >
      <Text variant="caption" style={{ color: selected ? theme.colors.onPrimary : theme.colors.text }}>
        {label}
      </Text>
    </Pressable>
  );
}
