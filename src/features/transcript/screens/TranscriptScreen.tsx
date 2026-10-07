import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { useTheme } from "../../../core/theme";
import { Card, QueryGate, Text } from "../../../core/ui";
import { gpa, termsForYear, totalCredits, useTranscriptItems, yearsOf } from "../store";

export function TranscriptScreen() {
  const query = useTranscriptItems();
  const { theme } = useTheme();
  const [year, setYear] = useState<string>("all");

  return (
    <QueryGate query={query} emptyTitle="No transcript yet" emptyMessage="Nothing to show in demo mode.">
      {(terms) => {
        const shown = termsForYear(terms, year);
        const cumulative = gpa(terms);
        return (
          <ScrollView showsVerticalScrollIndicator={false}>
            <Card style={{ marginBottom: theme.spacing.lg }}>
              <Text color="muted" variant="caption">
                Cumulative GPA (demo 4.0 scale) · {totalCredits(terms)} credit hours
              </Text>
              <Text variant="title" color="primary">
                {cumulative === null ? "—" : cumulative.toFixed(2)}
              </Text>
            </Card>

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: theme.spacing.sm,
                marginBottom: theme.spacing.lg,
              }}
            >
              {["all", ...yearsOf(terms)].map((id) => {
                const active = year === id;
                return (
                  <Pressable
                    key={id}
                    onPress={() => setYear(id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={{
                      paddingHorizontal: theme.spacing.md,
                      paddingVertical: theme.spacing.sm,
                      borderRadius: theme.radii.pill,
                      backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      minHeight: 36,
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      variant="caption"
                      style={{ color: active ? theme.colors.onPrimary : theme.colors.text }}
                    >
                      {id === "all" ? "All years" : id}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {shown.map((term) => (
              <View key={term.id} style={{ marginBottom: theme.spacing.lg }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: theme.spacing.sm,
                  }}
                >
                  <Text variant="heading" accessibilityRole="header">
                    {term.year} · {term.term}
                  </Text>
                  <Text color="muted">GPA {gpa([term])?.toFixed(2)}</Text>
                </View>
                <Card>
                  {term.courses.map((course, index) => (
                    <View
                      key={course.code}
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        paddingVertical: theme.spacing.sm,
                        borderTopWidth: index === 0 ? 0 : 1,
                        borderTopColor: theme.colors.border,
                      }}
                    >
                      <View style={{ flex: 1, paddingRight: theme.spacing.md }}>
                        <Text>{course.name}</Text>
                        <Text variant="caption" color="muted">
                          {course.code} · {course.creditHours} credit hours
                        </Text>
                      </View>
                      <Text style={{ fontWeight: "700" }}>{course.grade}</Text>
                    </View>
                  ))}
                </Card>
              </View>
            ))}
            <Text color="muted" variant="caption" style={{ textAlign: "center" }}>
              Demo data — not a real transcript.
            </Text>
          </ScrollView>
        );
      }}
    </QueryGate>
  );
}
