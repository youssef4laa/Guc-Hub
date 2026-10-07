import { examsItemSchema, type ExamsItem } from "./schema";
import type { ExamsSource } from "./source";

// Entirely fake. Dates are generated relative to "now" so the demo always has
// upcoming exams, whenever it is run.
const DAY = 24 * 60 * 60 * 1000;

function at(daysFromNow: number, hour: number, minute = 0): string {
  const d = new Date(Date.now() + daysFromNow * DAY);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function fakeExams(): ExamsItem[] {
  return [
    {
      id: "1",
      courseCode: "CSEN 401",
      courseName: "Computer Networks",
      kind: "midterm",
      startsAt: at(3, 9),
      durationMinutes: 90,
      room: "H14",
      seat: "C-22",
    },
    {
      id: "2",
      courseCode: "MATH 251",
      courseName: "Probability & Statistics",
      kind: "midterm",
      startsAt: at(5, 11, 30),
      durationMinutes: 120,
      room: "H8",
      seat: "A-07",
    },
    {
      id: "3",
      courseCode: "CSEN 403",
      courseName: "Operating Systems",
      kind: "quiz",
      startsAt: at(9, 13),
      durationMinutes: 30,
      room: "C6.104",
    },
    {
      id: "4",
      courseCode: "DMET 301",
      courseName: "Digital Media Design",
      kind: "midterm",
      startsAt: at(12, 9),
      durationMinutes: 90,
      room: "H3",
      seat: "B-15",
    },
    {
      id: "5",
      courseCode: "ENGD 301",
      courseName: "Engineering Ethics",
      kind: "final",
      startsAt: at(35, 9),
      durationMinutes: 180,
      room: "Hall A",
    },
    {
      id: "6",
      courseCode: "CSEN 401",
      courseName: "Computer Networks",
      kind: "quiz",
      startsAt: at(-6, 10),
      durationMinutes: 30,
      room: "C7.201",
    },
  ].map((exam) => examsItemSchema.parse(exam));
}

export const mockExamsSource: ExamsSource = {
  async fetch() {
    return fakeExams();
  },
};
