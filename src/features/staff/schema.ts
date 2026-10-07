import { z } from "zod";

export const staffItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string(),
  department: z.string(),
  email: z.string(),
  office: z.string(),
  officeHours: z.string(),
  courses: z.array(z.string()),
});

export type StaffItem = z.infer<typeof staffItemSchema>;
