import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { useTheme } from "../../../core/theme";
import { Button, Card, QueryGate, Text } from "../../../core/ui";
import type { Ratings } from "../schema";
import { MAX_RATING, canSubmit, pending, rateAll, useEvaluationsItems } from "../store";

export function EvaluationsScreen() {
  const query = useEvaluationsItems();
  const { theme } = useTheme();
  const [ratings, setRatings] = useState<Ratings>({});
  const [done, setDone] = useState(false);

  return (
    <QueryGate query={query} emptyTitle="No evaluations" emptyMessage="Nothing to show in demo mode.">
      {(items) => {
        const open = done ? [] : pending(items);
        return (
          <ScrollView showsVerticalScrollIndicator={false}>
            {open.length === 0 ? (
              <Card style={{ marginBottom: theme.spacing.lg }}>
                <Text style={{ fontWeight: "600" }}>All caught up</Text>
                <Text color="muted" variant="caption">
                  No pending course evaluations.
                </Text>
              </Card>
            ) : (
              <View style={{ marginBottom: theme.spacing.lg, gap: theme.spacing.sm }}>
                <Button
                  label={`Rate all ${MAX_RATING} stars`}
                  variant="secondary"
                  onPress={() => setRatings(rateAll(items, MAX_RATING))}
                />
              </View>
            )}

            {open.map((item) => (
              <Card key={item.id} style={{ marginBottom: theme.spacing.sm }}>
                <Text style={{ fontWeight: "600" }}>
                  {item.courseCode} · {item.courseName}
                </Text>
                <Text variant="caption" color="muted">
                  {item.instructor}
                </Text>
                <View style={{ flexDirection: "row", marginTop: theme.spacing.sm }}>
                  {Array.from({ length: MAX_RATING }, (_, i) => i + 1).map((star) => (
                    <Pressable
                      key={star}
                      onPress={() => setRatings((prev) => ({ ...prev, [item.id]: star }))}
                      accessibilityRole="button"
                      accessibilityLabel={`Rate ${item.courseCode} ${star} of ${MAX_RATING}`}
                      hitSlop={6}
                      style={{ padding: 6 }}
                    >
                      <Ionicons
                        name={(ratings[item.id] ?? 0) >= star ? "star" : "star-outline"}
                        size={30}
                        color={theme.colors.warning}
                      />
                    </Pressable>
                  ))}
                </View>
              </Card>
            ))}

            {open.length > 0 ? (
              <View style={{ marginTop: theme.spacing.md }}>
                <Button
                  label="Submit all"
                  disabled={!canSubmit(items, ratings)}
                  onPress={() => setDone(true)}
                />
              </View>
            ) : null}

            <Text
              color="muted"
              variant="caption"
              style={{ marginTop: theme.spacing.lg, textAlign: "center" }}
            >
              Demo mode — nothing is actually submitted anywhere.
            </Text>
          </ScrollView>
        );
      }}
    </QueryGate>
  );
}
