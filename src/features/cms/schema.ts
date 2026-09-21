import { z } from "zod";

// Define this feature's data shape here, and nowhere else. Other features may not
// import from here directly — only via a type re-exported through core/ if truly
// shared (rare; prefer duplication over a cross-feature dependency).
export const cmsItemSchema = z.object({
  id: z.string(),
  title: z.string(),
});

export type CmsItem = z.infer<typeof cmsItemSchema>;
