import type { StaffSource } from "./source";

export const mockStaffSource: StaffSource = {
  async fetch() {
    return [
      { id: "1", title: "Fake item one" },
      { id: "2", title: "Fake item two" },
    ];
  },
};
