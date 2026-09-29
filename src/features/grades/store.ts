import { useQuery } from "@tanstack/react-query";

import type { GradesItem } from "./schema";
import { getGradesSource } from "./source";

export function useGradesItems() {
  return useQuery({
    queryKey: ["grades", "items"],
    queryFn: async () => {
      const source = await getGradesSource();
      return source.fetch();
    },
  });
}

export type GradeTone = "success" | "primary" | "warning" | "danger";

export interface CourseResult {
  /** Percent of the *graded* weight earned; null if nothing is graded yet. */
  percent: number | null;
  gradedWeight: number;
}

export function courseResult(course: GradesItem): CourseResult {
  let earned = 0;
  let gradedWeight = 0;
  for (const component of course.components) {
    if (component.score === null) continue;
    earned += (component.score / component.max) * component.weight;
    gradedWeight += component.weight;
  }
  return { percent: gradedWeight === 0 ? null : (earned / gradedWeight) * 100, gradedWeight };
}

export function toneFor(percent: number | null): GradeTone {
  if (percent === null) return "primary";
  if (percent >= 85) return "success";
  if (percent >= 70) return "primary";
  if (percent >= 60) return "warning";
  return "danger";
}

/** Credit-hour-weighted average across courses that have at least one graded component. */
export function semesterAverage(courses: GradesItem[]): number | null {
  let total = 0;
  let credits = 0;
  for (const course of courses) {
    const { percent } = courseResult(course);
    if (percent === null) continue;
    total += percent * course.creditHours;
    credits += course.creditHours;
  }
  return credits === 0 ? null : total / credits;
}
