import { transcriptItemSchema } from "./schema";
import type { TranscriptSource } from "./source";

// Entirely fake transcript. The grade scale is an invented 4.0 demo scale.
const FAKE_TRANSCRIPT = [
  {
    id: "1",
    year: "2022/2023",
    term: "Semester 1",
    courses: [
      { code: "CSEN 101", name: "Intro to Programming", creditHours: 6, grade: "A", points: 4.0 },
      { code: "MATH 101", name: "Calculus I", creditHours: 6, grade: "B+", points: 3.3 },
      { code: "PHYS 101", name: "Physics I", creditHours: 4, grade: "B", points: 3.0 },
    ],
  },
  {
    id: "2",
    year: "2022/2023",
    term: "Semester 2",
    courses: [
      { code: "CSEN 102", name: "Data Structures", creditHours: 6, grade: "A-", points: 3.7 },
      { code: "MATH 102", name: "Calculus II", creditHours: 6, grade: "B", points: 3.0 },
      { code: "ENGD 101", name: "Technical Writing", creditHours: 2, grade: "A", points: 4.0 },
    ],
  },
  {
    id: "3",
    year: "2023/2024",
    term: "Semester 3",
    courses: [
      { code: "CSEN 201", name: "Algorithms", creditHours: 6, grade: "A", points: 4.0 },
      { code: "CSEN 203", name: "Computer Organization", creditHours: 6, grade: "B+", points: 3.3 },
      { code: "MATH 201", name: "Linear Algebra", creditHours: 4, grade: "A-", points: 3.7 },
    ],
  },
  {
    id: "4",
    year: "2023/2024",
    term: "Semester 4",
    courses: [
      { code: "CSEN 202", name: "Databases", creditHours: 6, grade: "A-", points: 3.7 },
      { code: "CSEN 204", name: "Software Engineering", creditHours: 6, grade: "A", points: 4.0 },
      { code: "MATH 202", name: "Discrete Math", creditHours: 4, grade: "B+", points: 3.3 },
    ],
  },
];

export const mockTranscriptSource: TranscriptSource = {
  async fetch() {
    return FAKE_TRANSCRIPT.map((term) => transcriptItemSchema.parse(term));
  },
};
