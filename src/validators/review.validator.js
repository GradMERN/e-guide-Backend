import { z } from "zod";

export const reviewSchema = z.object({
  tour: z.string().length(24, "Invalid tour ID format"),
  user: z.string().length(24, "Invalid user ID format"),
  rating: z
    .number()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
  comment: z
    .string()
    .min(3, "Comment must be at least 3 characters long")
    .max(1000, "Comment must be at most 1000 characters long"),
});

export const createReviewSchema = z.object({
  rating: z
    .number()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
  comment: z
    .string()
    .min(3, "Comment must be at least 3 characters long")
    .max(1000, "Comment must be at most 1000 characters long"),
});
