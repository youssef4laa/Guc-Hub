import type { AttendanceSource } from "./source";

export const mockAttendanceSource: AttendanceSource = {
  async fetch() {
    return [
      { id: "1", title: "Fake item one" },
      { id: "2", title: "Fake item two" },
    ];
  },
};
