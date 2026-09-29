import { z } from "zod";

export const gradeComponentSchema = z.object({
  name: z.string(),
  /** Share of the course total, in percent. */
  weight: z.number().min(0).max(100),
  /** null = not graded yet. */
  score: z.number().nullable(),
  max: z.number().positive(),
});

export const gradesItemSchema = z.object({
  id: z.string(),
  courseCode: z.string(),
  courseName: z.string(),
  creditHours: z.number().int().positive(),
  components: z.array(gradeComponentSchema),
});

export type GradeComponent = z.infer<typeof gradeComponentSchema>;
export type GradesItem = z.infer<typeof gradesItemSchema>;
