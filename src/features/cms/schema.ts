import { z } from "zod";

export const cmsFileTypeSchema = z.enum(["lecture", "tutorial", "assignment", "other"]);

export const cmsFileSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: cmsFileTypeSchema,
  /** ISO timestamp. */
  postedAt: z.string(),
  seen: z.boolean(),
});

export const cmsItemSchema = z.object({
  id: z.string(),
  courseCode: z.string(),
  courseName: z.string(),
  files: z.array(cmsFileSchema),
});

export type CmsFileType = z.infer<typeof cmsFileTypeSchema>;
export type CmsFile = z.infer<typeof cmsFileSchema>;
export type CmsItem = z.infer<typeof cmsItemSchema>;
