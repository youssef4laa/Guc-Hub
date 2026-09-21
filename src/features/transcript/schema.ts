import { z } from "zod";

// Define this feature's data shape here, and nowhere else. Other features may not
// import from here directly — only via a type re-exported through core/ if truly
// shared (rare; prefer duplication over a cross-feature dependency).
export const transcriptItemSchema = z.object({
  id: z.string(),
  title: z.string(),
});

export type TranscriptItem = z.infer<typeof transcriptItemSchema>;
