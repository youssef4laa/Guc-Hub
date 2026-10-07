import { z } from "zod";

export const examsItemSchema = z.object({
  id: z.string(),
  courseCode: z.string(),
  courseName: z.string(),
  kind: z.enum(["quiz", "midterm", "final"]),
  /** ISO timestamp of the start. */
  startsAt: z.string(),
  durationMinutes: z.number().int().positive(),
  room: z.string(),
  seat: z.string().optional(),
});

export type ExamsItem = z.infer<typeof examsItemSchema>;
