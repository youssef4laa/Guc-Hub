import { isDemoMode } from "../../core/portal/demoMode";
import type { FlappyItem } from "./schema";

export interface FlappySource {
  fetch(): Promise<FlappyItem[]>;
}

export async function getFlappySource(): Promise<FlappySource> {
  if (await isDemoMode()) {
    const { mockFlappySource } = await import("./mock");
    return mockFlappySource;
  }
  const { liveFlappySource } = await import("./live");
  return liveFlappySource;
}
