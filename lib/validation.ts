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

export const productCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Category name is required.")
    .max(80, "Category name must be 80 characters or fewer."),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required.")
    .max(96, "Slug must be 96 characters or fewer.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and single hyphens only.",
    ),
  description: z
    .string()
    .trim()
    .max(180, "Description must be 180 characters or fewer.")
    .optional()
    .or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const serviceCatalogSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Service name is required.")
    .max(80, "Service name must be 80 characters or fewer."),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required.")
    .max(96, "Slug must be 96 characters or fewer.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and single hyphens only.",
    ),
  summary: z
    .string()
    .trim()
    .min(12, "Short description is required.")
    .max(160, "Short description must be 160 characters or fewer."),
  description: z
    .string()
    .trim()
    .max(360, "Detailed description must be 360 characters or fewer.")
    .optional()
    .or(z.literal("")),
  group: z.enum(["Service & Maintenance", "Installation"]),
  iconKey: z.enum([
    "home-plus",
    "wrench",
    "activity",
    "shield",
    "sparkles",
    "sliders",
    "upload",
    "compass",
  ]),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  sortOrder: z
    .number({
      error: "Display order is required.",
    })
    .int("Display order must be a whole number.")
    .min(1, "Display order must be at least 1.")
    .max(999, "Display order must be 999 or fewer."),
});

export const technicianSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name is required.")
    .max(80, "Full name must be 80 characters or fewer."),
  email: emailSchema,
  phone: optionalPhoneSchema.refine((value) => value.trim().length > 0, {
    message: "Phone is required.",
  }),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  availability: z.enum(["AVAILABLE", "BUSY", "OFF_DUTY"]),
  notes: z
    .string()
    .trim()
    .max(400, "Notes must be 400 characters or fewer.")
    .optional()
    .or(z.literal("")),
});

export const quotationLineItemSchema = z.object({
  id: z.string().trim().min(1),
  description: z
    .string()
    .trim()
    .min(2, "Line item description is required.")
    .max(120, "Line item description must be 120 characters or fewer."),
  quantity: z
    .number({ error: "Quantity is required." })
    .min(0.01, "Quantity must be greater than 0.")
    .max(999, "Quantity must be 999 or fewer."),
  unitPriceUsd: z
    .number({ error: "Unit price is required." })
    .min(0, "Unit price cannot be negative.")
    .max(100000, "Unit price is too high."),
  note: z
    .string()
    .trim()
    .max(180, "Line item note must be 180 characters or fewer.")
    .optional()
    .or(z.literal("")),
});

export const quotationBuilderSchema = z
  .object({
    lineItems: z
      .array(quotationLineItemSchema)
      .min(1, "Add at least 1 quotation item."),
    discountUsd: z
      .number({ error: "Discount is required." })
      .min(0, "Discount cannot be negative.")
      .max(100000, "Discount is too high."),
    taxUsd: z
      .number({ error: "Tax is required." })
      .min(0, "Tax cannot be negative.")
      .max(100000, "Tax is too high."),
    notes: z
      .string()
      .trim()
      .max(700, "Notes must be 700 characters or fewer.")
      .optional()
      .or(z.literal("")),
    terms: z
      .string()
      .trim()
      .max(700, "Terms must be 700 characters or fewer.")
      .optional()
      .or(z.literal("")),
    expiresAt: z
      .string()
      .trim()
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (values) => {
      const subtotal = values.lineItems.reduce(
        (sum, item) => sum + item.quantity * item.unitPriceUsd,
        0,
      );
      return values.discountUsd <= subtotal + values.taxUsd;
    },
    {
      message: "Discount cannot exceed the subtotal plus tax.",
      path: ["discountUsd"],
    },
  );

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ContactValues = z.infer<typeof contactSchema>;
export type ProductCategoryValues = z.infer<typeof productCategorySchema>;
export type ServiceCatalogValues = z.infer<typeof serviceCatalogSchema>;
export type TechnicianValues = z.infer<typeof technicianSchema>;
export type QuotationBuilderValues = z.infer<typeof quotationBuilderSchema>;
