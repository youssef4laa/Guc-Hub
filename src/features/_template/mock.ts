import type { TemplateSource } from "./source";

export const mockTemplateSource: TemplateSource = {
  async fetch() {
    return [
      { id: "1", title: "Fake item one" },
      { id: "2", title: "Fake item two" },
    ];
  },
};
