import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .email("Enter a valid email address.");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .regex(/[A-Za-z]/, "Password must include at least 1 letter.")
  .regex(/\d/, "Password must include at least 1 number.");

const optionalPhoneSchema = z
  .string()
  .trim()
  .refine(
    (value) => value.length === 0 || /^[0-9+().\-\s]{10,20}$/.test(value),
    "Enter a valid phone number.",
  );

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter your full name.")
    .max(80, "Name must be 80 characters or fewer."),
  email: emailSchema,
  password: passwordSchema,
  termsAccepted: z.boolean().refine((value) => value, {
    message: "You must accept the terms to continue.",
  }),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter your name.")
    .max(80, "Name must be 80 characters or fewer."),
  email: emailSchema,
  phone: optionalPhoneSchema,
  serviceCategory: z
    .string()
    .trim()
    .min(1, "Choose a service category."),
  message: z
    .string()
    .trim()
    .min(10, "Share a bit more detail so we can route your request."),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ContactValues = z.infer<typeof contactSchema>;
