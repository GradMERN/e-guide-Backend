import { z } from "zod";

export const placeSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters long")
    .max(100, "Name must be at most 100 characters long")
    .trim()
    .nonempty("Place name is required"),
  country: z
    .string()
    .min(2, "Country must be at least 2 characters long")
    .max(50, "Country name is too long")
    .trim()
    .nonempty("Country is required"),
  city: z
    .string()
    .min(2, "City must be at least 2 characters long")
    .max(50, "City name is too long")
    .trim()
    .nonempty("City is required"),
  category: z.enum(
    ["historical", "cultural", "religious", "modern", "natural"],
    {
      errorMap: () => ({ message: "Invalid category" }),
    }
  ),
});

export const updatePlaceSchema = placeSchema.partial();
