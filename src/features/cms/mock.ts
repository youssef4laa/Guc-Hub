import { cmsItemSchema } from "./schema";
import type { CmsFileType } from "./schema";
import type { CmsSource } from "./source";

// Entirely fake course material — names are invented, nothing here was fetched.
const DAY = 24 * 60 * 60 * 1000;

function file(id: string, title: string, type: CmsFileType, daysAgo: number, seen: boolean) {
  return { id, title, type, postedAt: new Date(Date.now() - daysAgo * DAY).toISOString(), seen };
}

function fakeCourses() {
  return [
    {
      id: "1",
      courseCode: "CSEN 401",
      courseName: "Computer Networks",
      files: [
        file("1a", "Lecture 9 — Transport layer", "lecture", 1, false),
        file("1b", "Lecture 8 — Routing", "lecture", 8, true),
        file("1c", "Tutorial 5 — Subnetting", "tutorial", 3, false),
        file("1d", "Project milestone 2 brief", "assignment", 6, true),
      ],
    },
    {
      id: "2",
      courseCode: "MATH 251",
      courseName: "Probability & Statistics",
      files: [
        file("2a", "Lecture 11 — Hypothesis testing", "lecture", 2, false),
        file("2b", "Problem set 4", "assignment", 4, false),
        file("2c", "Tutorial 6 solutions", "tutorial", 10, true),
      ],
    },
    {
      id: "3",
      courseCode: "CSEN 403",
      courseName: "Operating Systems",
      files: [
        file("3a", "Lecture 10 — Virtual memory", "lecture", 5, true),
        file("3b", "Lab 6 — Scheduling", "assignment", 2, false),
        file("3c", "Syllabus & policies", "other", 40, true),
      ],
    },
  ].map((course) => cmsItemSchema.parse(course));
}

export const mockCmsSource: CmsSource = {
  async fetch() {
    return fakeCourses();
  },
};
