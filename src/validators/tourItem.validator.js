import { z } from "zod";

export const tourItemSchema = z.object({
  name: z.string().min(3, "Tour item name must be at least 3 characters long"),
  tour: z.string().length(24, "Invalid tour ID format"),
  mainImg: z.string().url("Main image must be a valid URL").optional(),
  imgs: z.array(z.string().url("Image must be a valid URL")).optional(),
  audio: z.string().url("Audio must be a valid URL").optional(),
  script: z.string().optional(),
  location: z.object({
    type: z.literal("Point"),
    coordinates: z
      .array(z.number())
      .length(2, "Coordinates must be an array of two numbers"),
  }),
});
