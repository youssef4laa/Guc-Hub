import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { useTheme } from "../../../core/theme";
import { Card, QueryGate, Text } from "../../../core/ui";
import type { CmsFile } from "../schema";
import { filterFiles, isUnseen, relativeDays, unseenCount, useCmsItems, type CmsFilter } from "../store";

const FILTERS: { id: CmsFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "lecture", label: "Lectures" },
  { id: "tutorial", label: "Tutorials" },
  { id: "assignment", label: "Assignments" },
];

const ICONS: Record<CmsFile["type"], keyof typeof Ionicons.glyphMap> = {
  lecture: "easel-outline",
  tutorial: "pencil-outline",
  assignment: "clipboard-outline",
  other: "document-outline",
};

export function CmsScreen() {
  const query = useCmsItems();
  const { theme } = useTheme();
  const [filter, setFilter] = useState<CmsFilter>("all");
  const [seen, setSeen] = useState<ReadonlySet<string>>(new Set());

  return (
    <QueryGate query={query} emptyTitle="No courses yet" emptyMessage="Nothing to show in demo mode.">
      {(courses) => (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: theme.spacing.sm,
              marginBottom: theme.spacing.lg,
            }}
          >
            {FILTERS.map(({ id, label }) => {
              const active = filter === id;
              return (
                <Pressable
                  key={id}
                  onPress={() => setFilter(id)}
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
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {courses.map((course) => {
            const files = filterFiles(course.files, filter);
            if (files.length === 0) return null;
            const unseen = unseenCount([course], seen);
            return (
              <View key={course.id} style={{ marginBottom: theme.spacing.lg }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: theme.spacing.sm }}>
                  <Text variant="heading" style={{ flex: 1 }}>
                    {course.courseCode} · {course.courseName}
                  </Text>
                  {unseen > 0 ? (
                    <View
                      accessibilityLabel={`${unseen} unseen`}
                      style={{
                        backgroundColor: theme.colors.danger,
                        borderRadius: theme.radii.pill,
                        minWidth: 24,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        alignItems: "center",
                      }}
                    >
                      <Text variant="caption" style={{ color: "#FFFFFF", fontWeight: "700" }}>
                        {unseen}
                      </Text>
                    </View>
                  ) : null}
                </View>
                {files.map((file) => {
                  const unread = isUnseen(file, seen);
                  return (
                    <Pressable
                      key={file.id}
                      accessibilityRole="button"
                      accessibilityLabel={`${file.title}, ${file.type}, ${unread ? "unseen" : "seen"}`}
                      onPress={() => setSeen((prev) => new Set(prev).add(file.id))}
                    >
                      <Card
                        style={{
                          marginBottom: theme.spacing.sm,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: theme.spacing.md,
                        }}
                      >
                        <Ionicons name={ICONS[file.type]} size={22} color={theme.colors.primary} />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: unread ? "700" : "400" }}>{file.title}</Text>
                          <Text variant="caption" color="muted">
                            {file.type} · {relativeDays(file.postedAt)}
                          </Text>
                        </View>
                        {unread ? (
                          <View
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: 5,
                              backgroundColor: theme.colors.primary,
                            }}
                          />
                        ) : null}
                      </Card>
                    </Pressable>
                  );
                })}
              </View>
            );
          })}
          <Text color="muted" variant="caption" style={{ textAlign: "center" }}>
            Demo data — tapping a file only marks it seen locally.
          </Text>
        </ScrollView>
      )}
    </QueryGate>
  );
}
