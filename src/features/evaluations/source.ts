import { isDemoMode } from "../../core/portal/demoMode";
import type { EvaluationsItem } from "./schema";

export interface EvaluationsSource {
  fetch(): Promise<EvaluationsItem[]>;
}

export async function getEvaluationsSource(): Promise<EvaluationsSource> {
  if (await isDemoMode()) {
    const { mockEvaluationsSource } = await import("./mock");
    return mockEvaluationsSource;
  }
  const { liveEvaluationsSource } = await import("./live");
  return liveEvaluationsSource;
}
