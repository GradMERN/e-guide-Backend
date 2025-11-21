import { z } from "zod";

export const tourSchema = z.object({
  name: z.string().min(3, "Tour name must be at least 3 characters long"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be a positive number"),
  mainImg: z.string().url("Main image must be a valid URL").optional(),
  coverImgs: z
    .array(z.string().url("Cover image must be a valid URL"))
    .optional(),
  place: z.string().length(24, "Invalid place ID format"),
  guide: z.string().length(24, "Invalid guide ID format"),
});
