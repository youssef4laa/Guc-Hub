import { isDemoMode } from "../../core/portal/demoMode";
import type { TranscriptItem } from "./schema";

export interface TranscriptSource {
  fetch(): Promise<TranscriptItem[]>;
}

export async function getTranscriptSource(): Promise<TranscriptSource> {
  if (await isDemoMode()) {
    const { mockTranscriptSource } = await import("./mock");
    return mockTranscriptSource;
  }
  const { liveTranscriptSource } = await import("./live");
  return liveTranscriptSource;
}
