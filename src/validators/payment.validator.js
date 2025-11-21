import { z } from "zod";

export const paymentSchema = z.object({
  user: z.string().length(24, "Invalid user ID format"),
  enrollment: z.string().length(24, "Invalid enrollment ID format"),
  tour: z.string().length(24, "Invalid tour ID format"),
  amount: z.number().min(0, "Amount must be a positive number"),
  stripePaymentIntentId: z.string().optional(),
  paymentMethod: z.string().optional(),
  currency: z.string().length(3, "Currency must be a 3-letter code"),
  status: z.enum(["pending", "paid", "failed", "refunded"], {
    errorMap: () => ({ message: "Invalid payment status" }),
  }),
});
