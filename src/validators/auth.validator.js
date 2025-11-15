import { z } from "zod";

export const registerSchema = z.object({
    firstName: z
        .string()
        .min(3, "First name must be at least 3 characters")
        .max(20, "First name must be at most 20 characters")
        .trim()
        .nonempty("First name is required"),

    lastName: z
        .string()
        .min(3, "Last name must be at least 3 characters")
        .max(20, "Last name must be at most 20 characters")
        .trim()
        .nonempty("Last name is required"),

    age: z
        .number("Age must be a number")
        .int("Age must be an integer")
        .min(13, "Age must be at least 13")
        .max(100, "Age must be at most 100"),

    email: z
        .email()
        .nonempty("Email is required"),

    password: z
        .string()
        .min(1, "Password is required")
        .min(12, "Password must be at least 12 characters long")
        .max(50, "Password must be at most 50 characters long")
        .superRefine((password, err) => {
        if (!/(.*[a-z]){2,}/.test(password)) {
            err.addIssue({
            code: "custom",
            message: "Password must contain at least two lowercase letters",
            });
        }

        if (!/(.*[A-Z]){2,}/.test(password)) {
            err.addIssue({
            code: "custom",
            message: "Password must contain at least two uppercase letters",
            });
        }

        if (!/(.*[0-9]){2,}/.test(password)) {
            err.addIssue({
            code: "custom",
            message: "Password must contain at least two digits",
            });
        }

        if (!/(.*[!@#$%^&*(),.?":{}|<>]){2,}/.test(password)) {
            err.addIssue({
            code: "custom",
            message: "Password must contain at least two special characters",
            });
        }

        if (/(.)\1{2,}/.test(password)) {
            err.addIssue({
            code: "custom",
            message:
                "Password cannot have more than 2 identical characters",
            });
        }

        if (/^\s|\s$/.test(password)) {
            err.addIssue({
            code: "custom",
            message: "Password cannot start or end with a space",
            });
        }
        }),

    phone: z
        .string()
        .regex(/^(?:\+20|0)?1[0125]\d{8}$/, "Invalid Egyptian phone number")
        .trim()
        .nonempty("Phone number is required"),

    country: z
        .string()
        .trim()
        .nonempty("Country is required"),

    city: z
        .string()
        .trim()
        .nonempty("City is required"),
});


export const loginSchema = z.object({
    email: z
        .email()
        .toLowerCase()
        .nonempty("Email is required"),

    password: z
        .string()
        .min(1,"Password is required")
        .min(12, "Password must be at least 12 characters")
        .max(50, "Password is too long") 
});


export const resendVerificationSchema = z.object({
    email: z
        .email()
        .toLowerCase()
        .nonempty("Email is required")
});


export const forgetPasswordSchema = z.object({
    email: z
        .email()
        .toLowerCase()
        .nonempty("Email is required")
});


export const resetPasswordSchema = z.object({
    newPassword:  z       
        .string()
        .min(1, "Password is required")
        .min(12, "Password must be at least 12 characters long")
        .max(50, "Password must be at most 50 characters long")
        .superRefine((password, err) => {
        if (!/(.*[a-z]){2,}/.test(password)) {
            err.addIssue({
            code: "custom",
            message: "Password must contain at least two lowercase letters",
            });
        }

        if (!/(.*[A-Z]){2,}/.test(password)) {
            err.addIssue({
            code: "custom",
            message: "Password must contain at least two uppercase letters",
            });
        }

        if (!/(.*[0-9]){2,}/.test(password)) {
            err.addIssue({
            code: "custom",
            message: "Password must contain at least two digits",
            });
        }

        if (!/(.*[!@#$%^&*(),.?":{}|<>]){2,}/.test(password)) {
            err.addIssue({
            code: "custom",
            message: "Password must contain at least two special characters",
            });
        }

        if (/(.)\1{2,}/.test(password)) {
            err.addIssue({
            code: "custom",
            message:
                "Password cannot have more than 2 identical characters",
            });
        }

        if (/^\s|\s$/.test(password)) {
            err.addIssue({
            code: "custom",
            message: "Password cannot start or end with a space",
            });
        }
        }),
});