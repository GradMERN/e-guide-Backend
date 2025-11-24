import { z } from "zod";

// ==================== TOUR VALIDATORS ====================

export const createTourSchema = z.object({
  name: z
    .string()
    .min(3, "Tour name must be at least 3 characters")
    .max(100, "Tour name must be at most 100 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be at most 2000 characters"),
  price: z.coerce.number().positive().min(0.99),
  place: z.string().regex(/^[0-9a-f]{24}$/, "Invalid place ID"),
  categories: z.preprocess((val) => {
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
        return [];
      }
    }
    return val;
  }, z.array(z.string()).optional()),
  tags: z.preprocess((val) => {
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
        return [];
      }
    }
    return val;
  }, z.array(z.string()).optional()),
  languages: z.preprocess((val) => {
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
        return [];
      }
    }
    return val;
  }, z.array(z.string()).optional()),
});

export const updateTourSchema = z.object({
  name: z
    .string()
    .min(3, "Tour name must be at least 3 characters")
    .max(100, "Tour name must be at most 100 characters")
    .optional(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be at most 2000 characters")
    .optional(),
  price: z.coerce.number().positive().min(0.99).optional(),
  place: z
    .string()
    .regex(/^[0-9a-f]{24}$/, "Invalid place ID")
    .optional(),
  categories: z.preprocess((val) => {
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
        return [];
      }
    }
    return val;
  }, z.array(z.string()).optional()),
  tags: z.preprocess((val) => {
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
        return [];
      }
    }
    return val;
  }, z.array(z.string()).optional()),
  languages: z.preprocess((val) => {
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
        return [];
      }
    }
    return val;
  }, z.array(z.string()).optional()),
  deletedGallaryImages: z.preprocess((val) => {
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
        return [];
      }
    }
    return val;
  }, z.array(z.string()).optional()),
});
