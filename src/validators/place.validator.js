import { z } from "zod";

export const placeSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long"),
  country: z.string().min(2, "Country must be at least 2 characters long"),
  city: z.string().min(2, "City must be at least 2 characters long"),
  category: z.enum(
    ["historical", "cultural", "religious", "modern", "natural"],
    {
      errorMap: () => ({ message: "Invalid category" }),
    }
  ),
});
