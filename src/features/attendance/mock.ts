import { attendanceItemSchema } from "./schema";
import type { AttendanceSource } from "./source";

// Entirely fake. The allowed-absence numbers are an invented demo policy.
const FAKE_ATTENDANCE = [
  {
    id: "1",
    courseCode: "CSEN 401",
    courseName: "Computer Networks",
    held: 22,
    attended: 21,
    allowedAbsences: 4,
  },
  {
    id: "2",
    courseCode: "MATH 251",
    courseName: "Probability & Statistics",
    held: 20,
    attended: 17,
    allowedAbsences: 4,
  },
  {
    id: "3",
    courseCode: "CSEN 403",
    courseName: "Operating Systems",
    held: 22,
    attended: 18,
    allowedAbsences: 4,
  },
  {
    id: "4",
    courseCode: "DMET 301",
    courseName: "Digital Media Design",
    held: 18,
    attended: 12,
    allowedAbsences: 4,
  },
  {
    id: "5",
    courseCode: "ENGD 301",
    courseName: "Engineering Ethics",
    held: 10,
    attended: 10,
    allowedAbsences: 2,
  },
];

export const mockAttendanceSource: AttendanceSource = {
  async fetch() {
    return FAKE_ATTENDANCE.map((course) => attendanceItemSchema.parse(course));
  },
};
