import { useRouter } from "expo-router";

import { Screen, Skeleton, ErrorState, EmptyState, useResponsiveLayout } from "../../../core/ui";
import { DayList } from "../components/DayList";
import { NextClassCard } from "../components/NextClassCard";
import { WeekView } from "../components/WeekView";
import { findNextClass, groupByDay, useSchedule } from "../store";

export function ScheduleScreen() {
  const { data, isPending, error, refetch } = useSchedule();
  const { isTablet } = useResponsiveLayout();
  const router = useRouter();

  if (isPending) {
    return (
      <Screen>
        <Skeleton style={{ height: 80, marginBottom: 16, borderRadius: 16 }} />
        <Skeleton style={{ height: 60, marginBottom: 12 }} />
        <Skeleton style={{ height: 60, marginBottom: 12 }} />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ErrorState
          error={error}
          onRetry={() => refetch()}
          onOpenOriginal={(url) => router.push({ pathname: "/webview", params: { url } })}
        />
      </Screen>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Screen>
        <EmptyState title="No schedule yet" message="Nothing to show in demo mode." />
      </Screen>
    );
  }

  const grouped = groupByDay(data);
  const nextClass = findNextClass(data);

  return (
    <Screen>
      <NextClassCard session={nextClass} />
      {isTablet ? <WeekView sessionsByDay={grouped} /> : <DayList sessionsByDay={grouped} />}
    </Screen>
  );
}
