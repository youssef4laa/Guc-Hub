import { notImplemented } from "../../core/portal/PortalError";
import type { TranscriptSource } from "./source";

export const liveTranscriptSource: TranscriptSource = {
  async fetch() {
    // Replace with: gucFetch(url) -> parser.ts -> transcriptItemSchema.parse(...).
    // Capture a real page first with the in-app "Capture page" dev tool.
    notImplemented("transcript");
  },
};
