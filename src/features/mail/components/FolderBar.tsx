import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";

import { useTheme } from "../../../core/theme";
import type { MailFolder } from "../schema";
import { Chip } from "./Chip";

export function FolderBar({
  folders,
  selectedId,
  onSelect,
}: {
  folders: MailFolder[];
  selectedId: string;
  onSelect: (folderId: string) => void;
}) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityLabel={t("mail.folders")}
      contentContainerStyle={{ gap: theme.spacing.sm, paddingVertical: theme.spacing.xs }}
    >
      {folders.map((folder) => (
        <Chip
          key={folder.id}
          label={folder.unreadCount > 0 ? `${folder.name} ${folder.unreadCount}` : folder.name}
          accessibilityLabel={
            folder.unreadCount > 0
              ? t("mail.folderLabel", { name: folder.name, count: folder.unreadCount })
              : folder.name
          }
          selected={folder.id === selectedId}
          onPress={() => onSelect(folder.id)}
        />
      ))}
    </ScrollView>
  );
}
