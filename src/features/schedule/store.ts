import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { rescheduleClassReminders } from "./reminders";
import { getScheduleSource } from "./source";
import type { ClassSession } from "./schema";

export function useSchedule() {
  const query = useQuery({
    queryKey: ["schedule", "sessions"],
    queryFn: async () => {
      const source = await getScheduleSource();
      return source.fetch();
    },
  });

  useEffect(() => {
    if (query.data) void rescheduleClassReminders(query.data);
  }, [query.data]);

  return query;
}

export function findNextClass(sessions: ClassSession[], now = new Date()): ClassSession | null {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const today = sessions
    .filter((s) => s.dayOfWeek === now.getDay() && s.endMinutes > nowMinutes)
    .sort((a, b) => a.startMinutes - b.startMinutes);
  if (today.length > 0) return today[0];

  for (let offset = 1; offset <= 7; offset++) {
    const day = (now.getDay() + offset) % 7;
    const upcoming = sessions
      .filter((s) => s.dayOfWeek === day)
      .sort((a, b) => a.startMinutes - b.startMinutes);
    if (upcoming.length > 0) return upcoming[0];
  }
  return null;
}

export function groupByDay(sessions: ClassSession[]): Map<number, ClassSession[]> {
  const map = new Map<number, ClassSession[]>();
  for (const session of sessions) {
    const list = map.get(session.dayOfWeek) ?? [];
    list.push(session);
    map.set(
      session.dayOfWeek,
      [...list].sort((a, b) => a.startMinutes - b.startMinutes),
    );
  }
  return map;
}
