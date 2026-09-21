import { z } from "zod";

export const sessionTypeSchema = z.enum(["lecture", "tutorial", "lab"]);
export type SessionType = z.infer<typeof sessionTypeSchema>;

/** 0 = Sunday, matching the GUC week (Sat/Sun start) and JS Date#getDay(). */
export const classSessionSchema = z.object({
  id: z.string(),
  courseCode: z.string(),
  courseName: z.string(),
  instructor: z.string(),
  location: z.string(),
  dayOfWeek: z.number().min(0).max(6),
  startMinutes: z
    .number()
    .min(0)
    .max(24 * 60),
  endMinutes: z
    .number()
    .min(0)
    .max(24 * 60),
  type: sessionTypeSchema,
});
export type ClassSession = z.infer<typeof classSessionSchema>;

export const scheduleSchema = z.array(classSessionSchema);
