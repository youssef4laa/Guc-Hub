import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { useTheme } from "../../../core/theme";
import { Button, Text } from "../../../core/ui";
import { formatBytes } from "../logic/format";
import { totalAttachmentBytes } from "../logic/draft";
import { safeAttachmentFilename } from "../security/attachments";
import type { OutgoingAttachment } from "../schema";

const UNKNOWN_TYPE = "application/octet-stream";

export function ComposeAttachments({
  attachments,
  onChange,
}: {
  attachments: OutgoingAttachment[];
  onChange: (attachments: OutgoingAttachment[]) => void;
}) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const pick = async () => {
    const result = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true });
    if (result.canceled) return;

    const picked = result.assets.map((asset) => ({
      // The filename is the student's own here, but it still ends up in a message
      // header and on a server, so it gets the same treatment as a received one.
      filename: safeAttachmentFilename(asset.name),
      mimeType: asset.mimeType ?? UNKNOWN_TYPE,
      sizeBytes: asset.size ?? 0,
      uri: asset.uri,
    }));
    onChange([...attachments, ...picked]);
  };

  return (
    <View style={{ gap: theme.spacing.sm }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: theme.spacing.sm }}>
        <Button label={t("mail.addAttachment")} variant="secondary" onPress={() => void pick()} />
        {attachments.length > 0 ? (
          <Text variant="caption" color="muted">
            {formatBytes(totalAttachmentBytes(attachments))}
          </Text>
        ) : null}
      </View>

      {attachments.map((attachment, index) => (
        <View
          key={`${attachment.uri}-${index}`}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: theme.spacing.sm,
            paddingVertical: theme.spacing.xs,
          }}
        >
          <Ionicons name="document-outline" size={16} color={theme.colors.textMuted} />
          <Text variant="caption" numberOfLines={1} style={{ flex: 1 }}>
            {attachment.filename} · {formatBytes(attachment.sizeBytes)}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("mail.removeAttachment", { name: attachment.filename })}
            onPress={() => onChange(attachments.filter((_, i) => i !== index))}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={18} color={theme.colors.textMuted} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}
