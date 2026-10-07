import { useQuery } from "@tanstack/react-query";

import type { ExamsItem } from "./schema";
import { getExamsSource } from "./source";

export function useExamsItems() {
  return useQuery({
    queryKey: ["exams", "items"],
    queryFn: async () => {
      const source = await getExamsSource();
      return source.fetch();
    },
  });
}

/** Upcoming exams first (soonest at the top), then past ones (most recent first). */
export function sortExams(
  exams: ExamsItem[],
  now = new Date(),
): { upcoming: ExamsItem[]; past: ExamsItem[] } {
  const t = now.getTime();
  const end = (e: ExamsItem) => new Date(e.startsAt).getTime() + e.durationMinutes * 60_000;
  const upcoming = exams.filter((e) => end(e) >= t).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const past = exams.filter((e) => end(e) < t).sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  return { upcoming, past };
}

export function countdown(iso: string, now = new Date()): string {
  const diff = new Date(iso).getTime() - now.getTime();
  if (diff <= 0) return "in progress";
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  if (days >= 1) return days === 1 ? "tomorrow" : `in ${days} days`;
  const hours = Math.max(1, Math.floor(diff / (60 * 60 * 1000)));
  return `in ${hours}h`;
}
