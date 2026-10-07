import { useQuery } from "@tanstack/react-query";

import type { TranscriptItem } from "./schema";
import { getTranscriptSource } from "./source";

export function useTranscriptItems() {
  return useQuery({
    queryKey: ["transcript", "items"],
    queryFn: async () => {
      const source = await getTranscriptSource();
      return source.fetch();
    },
  });
}

/** Credit-hour-weighted GPA over the given terms; null with no credit hours. */
export function gpa(terms: TranscriptItem[]): number | null {
  let points = 0;
  let credits = 0;
  for (const term of terms) {
    for (const course of term.courses) {
      points += course.points * course.creditHours;
      credits += course.creditHours;
    }
  }
  return credits === 0 ? null : points / credits;
}

export function totalCredits(terms: TranscriptItem[]): number {
  return terms.reduce((sum, t) => sum + t.courses.reduce((s, c) => s + c.creditHours, 0), 0);
}

export function yearsOf(terms: TranscriptItem[]): string[] {
  return [...new Set(terms.map((t) => t.year))].sort();
}

export function termsForYear(terms: TranscriptItem[], year: string | "all"): TranscriptItem[] {
  return year === "all" ? terms : terms.filter((t) => t.year === year);
}
