import { ScrollView, View } from "react-native";

import { useTheme } from "../../../core/theme";
import { Card, Text } from "../../../core/ui";
import type { ClassSession } from "../schema";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function DayList({ sessionsByDay }: { sessionsByDay: Map<number, ClassSession[]> }) {
  const { theme } = useTheme();
  const days = [...sessionsByDay.keys()].sort((a, b) => a - b);

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {days.map((day) => (
        <View key={day} style={{ marginBottom: theme.spacing.lg }} accessible accessibilityRole="header">
          <Text variant="heading" style={{ marginBottom: theme.spacing.sm }}>
            {DAY_NAMES[day]}
          </Text>
          {sessionsByDay.get(day)!.map((session) => (
            <Card key={session.id} style={{ marginBottom: theme.spacing.sm }}>
              <Text variant="body" style={{ fontWeight: "600" }}>
                {session.courseCode} · {session.courseName}
              </Text>
              <Text color="muted" variant="caption">
                {session.instructor} · {session.location}
              </Text>
            </Card>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}
