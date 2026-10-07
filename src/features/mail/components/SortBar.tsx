import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";

import { useTheme } from "../../../core/theme";
import { mailSortSchema, type MailSort } from "../schema";
import { Chip } from "./Chip";

const SORTS: MailSort[] = mailSortSchema.options;

export function SortBar({ sort, onChange }: { sort: MailSort; onChange: (sort: MailSort) => void }) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <ScrollView
      horizontal
      style={{ flexGrow: 0, minHeight: 44 }}
      showsHorizontalScrollIndicator={false}
      accessibilityLabel={t("mail.sortBy")}
      contentContainerStyle={{ gap: theme.spacing.sm, paddingVertical: theme.spacing.xs }}
    >
      {SORTS.map((option) => (
        <Chip
          key={option}
          label={t(`mail.sort.${option}`)}
          accessibilityLabel={`${t("mail.sortBy")}: ${t(`mail.sort.${option}`)}`}
          selected={option === sort}
          onPress={() => onChange(option)}
        />
      ))}
    </ScrollView>
  );
}
