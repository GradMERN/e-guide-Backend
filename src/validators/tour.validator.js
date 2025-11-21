import { z } from 'zod';

export const createTourSchema = z.object({
  name: z.string()
    .min(3, 'Tour name must be at least 3 characters')
    .max(100, 'Tour name must be at most 100 characters')
    .trim(),
  
  price: z.number()
    .positive('Price must be a positive number')
    .min(1, 'Price must be at least 1'),
  
  currency: z.enum(['EGP', 'USD', 'EUR'])
    .default('EGP'),
  
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be at most 2000 characters')
    .optional(),
  
  city: z.string()
    .min(2, 'City name must be at least 2 characters')
    .optional(),
  
  duration: z.number()
    .positive('Duration must be positive')
    .optional(),
  
  maxGroupSize: z.number()
    .positive('Max group size must be positive')
    .optional(),
  
  images: z.array(z.string().url()).optional(),
});

export const updateTourSchema = z.object({
  name: z.string()
    .min(3, 'Tour name must be at least 3 characters')
    .max(100, 'Tour name must be at most 100 characters')
    .trim()
    .optional(),
  
  price: z.number()
    .positive('Price must be a positive number')
    .optional(),
  
  currency: z.enum(['EGP', 'USD', 'EUR']).optional(),
  
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be at most 2000 characters')
    .optional(),
  
  city: z.string().min(2).optional(),
  duration: z.number().positive().optional(),
  maxGroupSize: z.number().positive().optional(),
  images: z.array(z.string().url()).optional(),
});

export const tourIdSchema = z.object({
  id: z.string()
    .length(24, 'Invalid tour ID format')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid tour ID format')
});