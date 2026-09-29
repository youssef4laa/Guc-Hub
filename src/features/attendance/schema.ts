import { z } from "zod";

export const attendanceItemSchema = z.object({
  id: z.string(),
  courseCode: z.string(),
  courseName: z.string(),
  /** Sessions held so far. */
  held: z.number().int().nonnegative(),
  /** Sessions the student attended. */
  attended: z.number().int().nonnegative(),
  /** Absences allowed before the course is at risk (demo policy, not GUC's). */
  allowedAbsences: z.number().int().nonnegative(),
});

export type AttendanceItem = z.infer<typeof attendanceItemSchema>;
