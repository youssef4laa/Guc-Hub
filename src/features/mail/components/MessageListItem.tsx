import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { useTheme } from "../../../core/theme";
import { Text } from "../../../core/ui";
import { formatListDate } from "../logic/format";
import { senderLabel } from "../logic/sorting";
import type { MailSummary } from "../schema";

export function MessageListItem({
  message,
  selected,
  onPress,
  onDelete,
}: {
  message: MailSummary;
  selected: boolean;
  onPress: () => void;
  /** When given, exposes delete as an accessibility action — swiping isn't reachable with a screen reader. */
  onDelete?: () => void;
}) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const subject = message.subject.trim() || t("mail.noSubject");
  const date = formatListDate(message.date);
  const label = t("mail.rowLabel", {
    status: message.isRead ? "" : t("mail.unreadStatus"),
    sender: senderLabel(message),
    subject,
    date,
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={message.hasAttachments ? `${label} ${t("mail.withAttachments")}.` : label}
      accessibilityActions={onDelete ? [{ name: "delete", label: t("mail.delete") }] : undefined}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === "delete") onDelete?.();
      }}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        gap: theme.spacing.sm,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.xs,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: selected || pressed ? theme.colors.surface : "transparent",
      })}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          marginTop: 7,
          backgroundColor: message.isRead ? "transparent" : theme.colors.primary,
        }}
      />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
          <Text numberOfLines={1} style={{ flex: 1, fontWeight: message.isRead ? "400" : "700" }}>
            {senderLabel(message)}
          </Text>
          {message.isFlagged ? <Ionicons name="flag" size={13} color={theme.colors.warning} /> : null}
          {message.hasAttachments ? (
            <Ionicons name="attach" size={14} color={theme.colors.textMuted} />
          ) : null}
          <Text variant="caption" color="muted">
            {date}
          </Text>
        </View>
        <Text numberOfLines={1} style={{ fontWeight: message.isRead ? "400" : "600" }}>
          {subject}
        </Text>
        <Text variant="caption" color="muted" numberOfLines={2}>
          {message.snippet}
        </Text>
      </View>
    </Pressable>
  );
}
