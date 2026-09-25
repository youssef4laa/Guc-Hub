import { useTranslation } from "react-i18next";
import { AccessibilityInfo, Pressable, View } from "react-native";
import { useEffect } from "react";

import { useTheme } from "../../../core/theme";
import { Text } from "../../../core/ui";

/**
 * Sits above the list after a delete. Announced to screen readers when it
 * appears, because it disappears on a timer and is easy to miss otherwise.
 */
export function UndoBar({ count, onUndo }: { count: number; onUndo: () => void }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const message = t("mail.deleted", { count });

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(message);
  }, [message]);

  return (
    <View
      style={{
        position: "absolute",
        start: theme.spacing.lg,
        end: theme.spacing.lg,
        bottom: theme.spacing.lg,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.radii.md,
        backgroundColor: theme.colors.text,
      }}
    >
      <Text variant="caption" style={{ color: theme.colors.background, flex: 1 }}>
        {message}
      </Text>
      <Pressable accessibilityRole="button" accessibilityLabel={t("mail.undo")} onPress={onUndo} hitSlop={8}>
        <Text variant="caption" style={{ color: theme.colors.background, fontWeight: "700" }}>
          {t("mail.undo")}
        </Text>
      </Pressable>
    </View>
  );
}
