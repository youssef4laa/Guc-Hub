import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useTheme } from "../../../core/theme";
import { Card, Text } from "../../../core/ui";
import type { ClassSession } from "../schema";

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? "PM" : "AM";
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour}:${String(m).padStart(2, "0")} ${period}`;
}

export function NextClassCard({ session }: { session: ClassSession | null }) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <Card style={{ marginBottom: theme.spacing.lg }}>
      <Text variant="caption" color="muted">
        {t("schedule.nextClass").toUpperCase()}
      </Text>
      {session ? (
        <View style={{ marginTop: theme.spacing.xs, gap: 2 }}>
          <Text variant="heading">
            {session.courseCode} · {session.courseName}
          </Text>
          <Text color="muted">
            {formatTime(session.startMinutes)}–{formatTime(session.endMinutes)} · {session.location}
          </Text>
        </View>
      ) : (
        <Text style={{ marginTop: theme.spacing.xs }}>{t("schedule.noClassesToday")}</Text>
      )}
    </Card>
  );
}
