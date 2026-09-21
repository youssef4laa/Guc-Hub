import { isDemoMode } from "../../core/portal/demoMode";
import type { GradesItem } from "./schema";

export interface GradesSource {
  fetch(): Promise<GradesItem[]>;
}

export async function getGradesSource(): Promise<GradesSource> {
  if (await isDemoMode()) {
    const { mockGradesSource } = await import("./mock");
    return mockGradesSource;
  }
  const { liveGradesSource } = await import("./live");
  return liveGradesSource;
}
