import { isDemoMode } from "../../core/portal/demoMode";
import type { ExamsItem } from "./schema";

export interface ExamsSource {
  fetch(): Promise<ExamsItem[]>;
}

export async function getExamsSource(): Promise<ExamsSource> {
  if (await isDemoMode()) {
    const { mockExamsSource } = await import("./mock");
    return mockExamsSource;
  }
  const { liveExamsSource } = await import("./live");
  return liveExamsSource;
}
