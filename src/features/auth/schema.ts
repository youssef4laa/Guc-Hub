import { z } from "zod";

export const loginFormSchema = z.object({
  username: z.string().min(1, "Required"),
  password: z.string().min(1, "Required"),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
