import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { useTheme } from "../../../core/theme";
import { Text } from "../../../core/ui";

export function SelectionBar({
  count,
  allSelected,
  readAction,
  onSelectAll,
  onMarkRead,
  onDelete,
  onCancel,
}: {
  count: number;
  allSelected: boolean;
  readAction: "read" | "unread";
  onSelectAll: () => void;
  onMarkRead: () => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const action = (
    label: string,
    icon: keyof typeof Ionicons.glyphMap,
    onPress: () => void,
    danger = false,
  ) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={count === 0}
      hitSlop={8}
      style={{ padding: theme.spacing.sm, opacity: count === 0 ? 0.4 : 1 }}
    >
      <Ionicons name={icon} size={20} color={danger ? theme.colors.danger : theme.colors.primary} />
    </Pressable>
  );

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.xs,
        paddingVertical: theme.spacing.xs,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("mail.cancelSelection")}
        onPress={onCancel}
        hitSlop={8}
        style={{ padding: theme.spacing.sm }}
      >
        <Ionicons name="close" size={20} color={theme.colors.text} />
      </Pressable>

      <Text variant="caption" style={{ flex: 1, fontWeight: "600" }}>
        {t("mail.selectedCount", { count })}
      </Text>

      {action(
        allSelected ? t("mail.selectNone") : t("mail.selectAll"),
        allSelected ? "remove-circle-outline" : "checkmark-done-outline",
        onSelectAll,
      )}
      {action(
        readAction === "read" ? t("mail.markRead") : t("mail.markUnread"),
        readAction === "read" ? "mail-open-outline" : "mail-unread-outline",
        onMarkRead,
      )}
      {action(t("mail.delete"), "trash-outline", onDelete, true)}
    </View>
  );
}
