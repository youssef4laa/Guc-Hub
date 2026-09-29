import { evaluationsItemSchema } from "./schema";
import type { EvaluationsSource } from "./source";

// Entirely fake courses and instructors.
const FAKE_EVALUATIONS = [
  {
    id: "1",
    courseCode: "CSEN 401",
    courseName: "Computer Networks",
    instructor: "Dr. Mona Farouk",
    submitted: false,
  },
  {
    id: "2",
    courseCode: "MATH 251",
    courseName: "Probability & Statistics",
    instructor: "Dr. Karim Adel",
    submitted: false,
  },
  {
    id: "3",
    courseCode: "CSEN 403",
    courseName: "Operating Systems",
    instructor: "Dr. Salma Hegazy",
    submitted: false,
  },
  {
    id: "4",
    courseCode: "DMET 301",
    courseName: "Digital Media Design",
    instructor: "Eng. Omar Nabil",
    submitted: true,
  },
];

export const mockEvaluationsSource: EvaluationsSource = {
  async fetch() {
    return FAKE_EVALUATIONS.map((item) => evaluationsItemSchema.parse(item));
  },
};
