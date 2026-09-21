import { ScrollView, View } from "react-native";

import { useTheme } from "../../../core/theme";
import { Card, Text } from "../../../core/ui";
import type { ClassSession } from "../schema";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function WeekView({ sessionsByDay }: { sessionsByDay: Map<number, ClassSession[]> }) {
  const { theme } = useTheme();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ flexDirection: "row", gap: theme.spacing.md }}>
        {DAY_LABELS.map((label, day) => (
          <View key={label} style={{ width: 200 }}>
            <Text variant="heading" style={{ marginBottom: theme.spacing.sm, textAlign: "center" }}>
              {label}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {(sessionsByDay.get(day) ?? []).map((session) => (
                <Card key={session.id} style={{ marginBottom: theme.spacing.sm }}>
                  <Text style={{ fontWeight: "600" }}>{session.courseCode}</Text>
                  <Text variant="caption" color="muted">
                    {session.location}
                  </Text>
                </Card>
              ))}
            </ScrollView>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
