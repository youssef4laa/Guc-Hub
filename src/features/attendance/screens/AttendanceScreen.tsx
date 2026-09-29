import { ScrollView, View } from "react-native";

import { useTheme } from "../../../core/theme";
import { Card, QueryGate, Text } from "../../../core/ui";
import { absences, attendancePercent, statusFor, useAttendanceItems } from "../store";

const STATUS_COLOR = { ok: "success", warning: "warning", danger: "danger" } as const;
const STATUS_LABEL = { ok: "On track", warning: "Close to the limit", danger: "Over the limit" } as const;

export function AttendanceScreen() {
  const query = useAttendanceItems();
  const { theme } = useTheme();

  return (
    <QueryGate query={query} emptyTitle="No attendance yet" emptyMessage="Nothing to show in demo mode.">
      {(courses) => (
        <ScrollView showsVerticalScrollIndicator={false}>
          {courses.map((course) => {
            const status = statusFor(course);
            const color = theme.colors[STATUS_COLOR[status]];
            const percent = attendancePercent(course);
            return (
              <Card key={course.id} style={{ marginBottom: theme.spacing.sm }}>
                <View
                  accessible
                  accessibilityLabel={`${course.courseCode} ${course.courseName}, attended ${course.attended} of ${course.held}, ${STATUS_LABEL[status]}`}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontWeight: "600", flex: 1 }}>
                      {course.courseCode} · {course.courseName}
                    </Text>
                    <Text style={{ color, fontWeight: "700" }}>{percent.toFixed(0)}%</Text>
                  </View>
                  <View
                    style={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: theme.colors.border,
                      marginVertical: theme.spacing.sm,
                      overflow: "hidden",
                    }}
                  >
                    <View style={{ width: `${percent}%`, height: 8, backgroundColor: color }} />
                  </View>
                  <Text variant="caption" color="muted">
                    Attended {course.attended} of {course.held} · {absences(course)} of{" "}
                    {course.allowedAbsences} absences used
                  </Text>
                  <Text variant="caption" style={{ color }}>
                    {STATUS_LABEL[status]}
                  </Text>
                </View>
              </Card>
            );
          })}
          <Text color="muted" variant="caption" style={{ marginTop: theme.spacing.md, textAlign: "center" }}>
            Demo data and an invented absence policy — check the official portal for yours.
          </Text>
        </ScrollView>
      )}
    </QueryGate>
  );
}
