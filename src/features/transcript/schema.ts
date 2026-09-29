import { z } from "zod";

export const transcriptCourseSchema = z.object({
  code: z.string(),
  name: z.string(),
  creditHours: z.number().int().positive(),
  /** Letter grade as shown on a transcript. */
  grade: z.string(),
  /** Grade points on a 4.0 scale (demo scale, not GUC's). */
  points: z.number().min(0).max(4),
});

export const transcriptItemSchema = z.object({
  id: z.string(),
  /** Academic year label, e.g. "2022/2023". */
  year: z.string(),
  term: z.string(),
  courses: z.array(transcriptCourseSchema),
});

export type TranscriptCourse = z.infer<typeof transcriptCourseSchema>;
export type TranscriptItem = z.infer<typeof transcriptItemSchema>;
