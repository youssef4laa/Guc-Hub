import type { FlappySource } from "./source";

export const mockFlappySource: FlappySource = {
  async fetch() {
    return [
      { id: "1", title: "Fake item one" },
      { id: "2", title: "Fake item two" },
    ];
  },
};
