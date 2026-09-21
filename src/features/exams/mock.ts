import type { ExamsSource } from "./source";

export const mockExamsSource: ExamsSource = {
  async fetch() {
    return [
      { id: "1", title: "Fake item one" },
      { id: "2", title: "Fake item two" },
    ];
  },
};
