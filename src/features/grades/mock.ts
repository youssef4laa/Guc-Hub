import { gradesItemSchema } from "./schema";
import type { GradesSource } from "./source";

// Entirely fake — invented courses and scores, safe to commit and to screenshot.
const FAKE_GRADES = [
  {
    id: "1",
    courseCode: "CSEN 401",
    courseName: "Computer Networks",
    creditHours: 6,
    components: [
      { name: "Quizzes", weight: 15, score: 13, max: 15 },
      { name: "Project", weight: 25, score: 22.5, max: 25 },
      { name: "Midterm", weight: 20, score: 17, max: 20 },
      { name: "Final", weight: 40, score: null, max: 40 },
    ],
  },
  {
    id: "2",
    courseCode: "MATH 251",
    courseName: "Probability & Statistics",
    creditHours: 4,
    components: [
      { name: "Quizzes", weight: 20, score: 12, max: 20 },
      { name: "Midterm", weight: 30, score: 19, max: 30 },
      { name: "Final", weight: 50, score: null, max: 50 },
    ],
  },
  {
    id: "3",
    courseCode: "CSEN 403",
    courseName: "Operating Systems",
    creditHours: 6,
    components: [
      { name: "Assignments", weight: 20, score: 18, max: 20 },
      { name: "Lab work", weight: 20, score: 19, max: 20 },
      { name: "Midterm", weight: 20, score: 16, max: 20 },
      { name: "Final", weight: 40, score: null, max: 40 },
    ],
  },
  {
    id: "4",
    courseCode: "DMET 301",
    courseName: "Digital Media Design",
    creditHours: 4,
    components: [
      { name: "Portfolio", weight: 40, score: 24, max: 40 },
      { name: "Midterm", weight: 20, score: 9, max: 20 },
      { name: "Final", weight: 40, score: null, max: 40 },
    ],
  },
  {
    id: "5",
    courseCode: "ENGD 301",
    courseName: "Engineering Ethics",
    creditHours: 2,
    components: [
      { name: "Essay", weight: 30, score: 12, max: 30 },
      { name: "Presentation", weight: 20, score: 8, max: 20 },
      { name: "Final", weight: 50, score: null, max: 50 },
    ],
  },
];

export const mockGradesSource: GradesSource = {
  async fetch() {
    return FAKE_GRADES.map((course) => gradesItemSchema.parse(course));
  },
};
