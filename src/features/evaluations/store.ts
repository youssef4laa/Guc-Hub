import { useQuery } from "@tanstack/react-query";

import type { EvaluationsItem, Ratings } from "./schema";
import { getEvaluationsSource } from "./source";

export function useEvaluationsItems() {
  return useQuery({
    queryKey: ["evaluations", "items"],
    queryFn: async () => {
      const source = await getEvaluationsSource();
      return source.fetch();
    },
  });
}

export const MIN_RATING = 1;
export const MAX_RATING = 5;

export function pending(items: EvaluationsItem[]): EvaluationsItem[] {
  return items.filter((i) => !i.submitted);
}

/** Give every pending evaluation the same rating — the "fast submit" shortcut. */
export function rateAll(items: EvaluationsItem[], rating: number): Ratings {
  const clamped = Math.min(MAX_RATING, Math.max(MIN_RATING, Math.round(rating)));
  return Object.fromEntries(pending(items).map((i) => [i.id, clamped]));
}

/** Submittable once every pending evaluation has a rating. */
export function canSubmit(items: EvaluationsItem[], ratings: Ratings): boolean {
  const open = pending(items);
  return open.length > 0 && open.every((i) => ratings[i.id] !== undefined);
}
