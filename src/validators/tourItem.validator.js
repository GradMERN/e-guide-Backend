import { z } from "zod";

export const createTourItemSchema = z.object({
  title: z.string().min(3, "Tour item name must be at least 3 characters long"),
  tour: z.string().length(24, "Invalid tour ID format"),
  location: z.preprocess(
    (val) => {
      if (typeof val === "string") {
        try {
          return JSON.parse(val);
        } catch {
          return [];
        }
      }
      return val;
    },
    z.object({
      type: z.literal("Point").default("Point"),

      coordinates: z.preprocess((val) => {
        // form-data sends strings → "[31.12, 30.55]"
        if (typeof val === "string") {
          try {
            return JSON.parse(val); // returns array
          } catch {
            return []; // invalid JSON → fail validation
          }
        }
        return val;
      }, z.array(z.number()).length(2, "Coordinates must be an array [longitude, latitude]")),
    })
  ),

  script: z.string().max(5000, "Script must be at most 5000 characters long"),
  contentType: z.string().optional(),
});

export const updateTourItemSchema = z.object({
  title: z
    .string()
    .min(3, "Tour item name must be at least 3 characters long")
    .optional(),
  tour: z.string().length(24, "Invalid tour ID format").optional(),
  location: z
    .preprocess(
      (val) => {
        if (typeof val === "string") {
          try {
            return JSON.parse(val);
          } catch {
            return [];
          }
        }
        return val;
      },
      z.object({
        type: z.literal("Point").default("Point"),

        coordinates: z
          .preprocess((val) => {
            // form-data sends strings → "[31.12, 30.55]"
            if (typeof val === "string") {
              try {
                return JSON.parse(val); // returns array
              } catch {
                return []; // invalid JSON → fail validation
              }
            }
            return val;
          }, z.array(z.number()).length(2, "Coordinates must be an array [longitude, latitude]"))
          .optional(),
      })
    )
    .optional(),
  script: z
    .string()
    .max(5000, "Script must be at most 5000 characters long")
    .optional(),
  contentType: z.string().optional(),
  deletedGallaryImages: z.preprocess((val) => {
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
        return [];
      }
    }
  }, z.array(z.string()).optional()),
});
