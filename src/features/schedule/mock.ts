import type { ClassSession } from "./schema";
import type { ScheduleSource } from "./source";

// Entirely fake — no real GUC course data. Names and codes are made up so this is
// safe to commit and safe to screenshot for the App/Play Store.
const FAKE_SCHEDULE: ClassSession[] = [
  {
    id: "1",
    courseCode: "CSEN 401",
    courseName: "Computer Networks",
    instructor: "Dr. Mona Farouk",
    location: "C7.201",
    dayOfWeek: 0,
    startMinutes: 9 * 60,
    endMinutes: 10 * 60 + 30,
    type: "lecture",
  },
  {
    id: "2",
    courseCode: "MATH 251",
    courseName: "Probability & Statistics",
    instructor: "Dr. Karim Adel",
    location: "C6.104",
    dayOfWeek: 0,
    startMinutes: 11 * 60,
    endMinutes: 12 * 60 + 30,
    type: "tutorial",
  },
  {
    id: "3",
    courseCode: "CSEN 403",
    courseName: "Operating Systems",
    instructor: "Dr. Sara Nabil",
    location: "C5 Lab 3",
    dayOfWeek: 1,
    startMinutes: 8 * 60 + 30,
    endMinutes: 11 * 60 + 30,
    type: "lab",
  },
  {
    id: "4",
    courseCode: "MGT 201",
    courseName: "Engineering Economics",
    instructor: "Dr. Yasmine Tarek",
    location: "C4.010",
    dayOfWeek: 2,
    startMinutes: 10 * 60,
    endMinutes: 11 * 60 + 30,
    type: "lecture",
  },
  {
    id: "5",
    courseCode: "CSEN 401",
    courseName: "Computer Networks",
    instructor: "Eng. Ahmed Rizk",
    location: "C7 Lab 1",
    dayOfWeek: 3,
    startMinutes: 13 * 60,
    endMinutes: 15 * 60,
    type: "lab",
  },
];

export const mockScheduleSource: ScheduleSource = {
  async fetch() {
    return FAKE_SCHEDULE;
  },
};
