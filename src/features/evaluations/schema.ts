import { z } from "zod";

export const evaluationsItemSchema = z.object({
  id: z.string(),
  courseCode: z.string(),
  courseName: z.string(),
  instructor: z.string(),
  submitted: z.boolean(),
});

export type EvaluationsItem = z.infer<typeof evaluationsItemSchema>;
export type Ratings = Record<string, number>;
