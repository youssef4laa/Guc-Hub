import { ScrollView, View } from "react-native";

import { useTheme } from "../../../core/theme";
import { Card, QueryGate, Text } from "../../../core/ui";
import type { ExamsItem } from "../schema";
import { countdown, sortExams, useExamsItems } from "../store";

const KIND_LABEL = { quiz: "Quiz", midterm: "Midterm", final: "Final" } as const;

function formatWhen(iso: string, durationMinutes: number): string {
  const start = new Date(iso);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  const day = start.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
  const time = (d: Date) => d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return `${day} · ${time(start)}–${time(end)}`;
}

function ExamCard({ exam, past }: { exam: ExamsItem; past?: boolean }) {
  const { theme } = useTheme();
  return (
    <Card style={{ marginBottom: theme.spacing.sm, opacity: past ? 0.55 : 1 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1, paddingRight: theme.spacing.md }}>
          <Text style={{ fontWeight: "600" }}>
            {exam.courseCode} · {KIND_LABEL[exam.kind]}
          </Text>
          <Text variant="caption" color="muted">
            {exam.courseName}
          </Text>
        </View>
        {past ? null : (
          <Text variant="caption" color="primary" style={{ fontWeight: "700" }}>
            {countdown(exam.startsAt)}
          </Text>
        )}
      </View>
      <Text variant="caption" style={{ marginTop: theme.spacing.sm }}>
        {formatWhen(exam.startsAt, exam.durationMinutes)}
      </Text>
      <Text variant="caption" color="muted">
        Room {exam.room}
        {exam.seat ? ` · Seat ${exam.seat}` : ""}
      </Text>
    </Card>
  );
}

export function ExamsScreen() {
  const query = useExamsItems();
  const { theme } = useTheme();

  return (
    <QueryGate query={query} emptyTitle="No exams scheduled" emptyMessage="Nothing to show in demo mode.">
      {(exams) => {
        const { upcoming, past } = sortExams(exams);
        return (
          <ScrollView showsVerticalScrollIndicator={false}>
            {upcoming.length > 0 ? (
              <Text variant="heading" style={{ marginBottom: theme.spacing.sm }} accessibilityRole="header">
                Upcoming
              </Text>
            ) : null}
            {upcoming.map((exam) => (
              <ExamCard key={exam.id} exam={exam} />
            ))}
            {past.length > 0 ? (
              <Text
                variant="heading"
                style={{ marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm }}
                accessibilityRole="header"
              >
                Past
              </Text>
            ) : null}
            {past.map((exam) => (
              <ExamCard key={exam.id} exam={exam} past />
            ))}
            <Text
              color="muted"
              variant="caption"
              style={{ marginTop: theme.spacing.md, textAlign: "center" }}
            >
              Demo data — verify real exam rooms on the official portal.
            </Text>
          </ScrollView>
        );
      }}
    </QueryGate>
  );
}
