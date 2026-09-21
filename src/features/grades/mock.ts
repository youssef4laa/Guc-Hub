import type { GradesSource } from "./source";

export const mockGradesSource: GradesSource = {
  async fetch() {
    return [
      { id: "1", title: "Fake item one" },
      { id: "2", title: "Fake item two" },
    ];
  },
};
