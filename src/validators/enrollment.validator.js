import { z } from "zod";

export const enrollmentSchema = z.object({
  user: z.string().length(24, "Invalid user ID format"),
  tour: z.string().length(24, "Invalid tour ID format"),
  status: z.enum(["pending", "in_progress", "expired"], {
    errorMap: () => ({ message: "Invalid status value" }),
  }),
  expiresAt: z.date().optional(),
});
