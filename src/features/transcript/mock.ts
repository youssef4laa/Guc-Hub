import type { TranscriptSource } from "./source";

export const mockTranscriptSource: TranscriptSource = {
  async fetch() {
    return [
      { id: "1", title: "Fake item one" },
      { id: "2", title: "Fake item two" },
    ];
  },
};
