import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { useTheme } from "../../../core/theme";
import { Card, QueryGate, Text } from "../../../core/ui";
import type { GradesItem } from "../schema";
import { courseResult, semesterAverage, toneFor, useGradesItems, type GradeTone } from "../store";

function useToneColor() {
  const { theme } = useTheme();
  return (tone: GradeTone) => theme.colors[tone];
}

function CourseCard({ course }: { course: GradesItem }) {
  const { theme } = useTheme();
  const toneColor = useToneColor();
  const [open, setOpen] = useState(false);
  const { percent, gradedWeight } = courseResult(course);
  const color = toneColor(toneFor(percent));

  return (
    <Pressable
      onPress={() => setOpen((v) => !v)}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      accessibilityLabel={`${course.courseCode} ${course.courseName}, ${
        percent === null ? "not graded yet" : `${percent.toFixed(0)} percent`
      }`}
    >
      <Card style={{ marginBottom: theme.spacing.sm, borderLeftWidth: 4, borderLeftColor: color }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flex: 1, paddingRight: theme.spacing.md }}>
            <Text style={{ fontWeight: "600" }}>
              {course.courseCode} · {course.courseName}
            </Text>
            <Text color="muted" variant="caption">
              {course.creditHours} credit hours · {gradedWeight}% of grade published
            </Text>
          </View>
          <Text variant="heading" style={{ color }}>
            {percent === null ? "—" : `${percent.toFixed(0)}%`}
          </Text>
        </View>
        {open ? (
          <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.xs }}>
            {course.components.map((component) => (
              <View key={component.name} style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text variant="caption">
                  {component.name} ({component.weight}%)
                </Text>
                <Text variant="caption" color="muted">
                  {component.score === null ? "pending" : `${component.score} / ${component.max}`}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </Card>
    </Pressable>
  );
}

export function GradesScreen() {
  const query = useGradesItems();
  const { theme } = useTheme();
  const toneColor = useToneColor();

  return (
    <QueryGate query={query} emptyTitle="No grades yet" emptyMessage="Nothing published this semester.">
      {(courses) => {
        const average = semesterAverage(courses);
        return (
          <ScrollView showsVerticalScrollIndicator={false}>
            <Card style={{ marginBottom: theme.spacing.lg }}>
              <Text color="muted" variant="caption">
                Semester average (credit-weighted, published grades only)
              </Text>
              <Text variant="title" style={{ color: toneColor(toneFor(average)) }}>
                {average === null ? "—" : `${average.toFixed(1)}%`}
              </Text>
            </Card>
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
            <Text
              color="muted"
              variant="caption"
              style={{ marginTop: theme.spacing.sm, textAlign: "center" }}
            >
              Demo data — not real grades.
            </Text>
          </ScrollView>
        );
      }}
    </QueryGate>
  );
}
