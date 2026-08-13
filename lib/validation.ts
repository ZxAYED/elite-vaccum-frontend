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

export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Product name is required.")
    .max(120, "Product name must be 120 characters or fewer."),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required.")
    .max(120, "Slug must be 120 characters or fewer.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and single hyphens only.",
    ),
  categoryId: z.string().trim().min(1, "Choose a category."),
  sku: z
    .string()
    .trim()
    .max(60, "SKU must be 60 characters or fewer.")
    .optional()
    .or(z.literal("")),
  model: z
    .string()
    .trim()
    .max(80, "Model must be 80 characters or fewer.")
    .optional()
    .or(z.literal("")),
  summary: z
    .string()
    .trim()
    .min(2, "Short summary is required.")
    .max(120, "Summary must be 120 characters or fewer."),
  description: z
    .string()
    .trim()
    .min(12, "Description is required.")
    .max(500, "Description must be 500 characters or fewer."),
  priceUsd: z
    .number({ error: "Price is required." })
    .min(0, "Price cannot be negative.")
    .max(100000, "Price is too high."),
  availability: z.enum(["in-stock", "special-order"]),
  status: z.enum(["active", "draft", "archived"]),
  taxable: z.boolean(),
  shippingLabel: z
    .string()
    .trim()
    .max(120, "Shipping information must be 120 characters or fewer.")
    .optional()
    .or(z.literal("")),
  images: z
    .string()
    .trim()
    .min(1, "Upload at least 1 product image."),
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
  password: z
    .string()
    .optional()
    .or(z.literal("")),
});

export const customerOverviewSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "First name is required.")
    .max(60, "First name must be 60 characters or fewer."),
  lastName: z
    .string()
    .trim()
    .min(2, "Last name is required.")
    .max(60, "Last name must be 60 characters or fewer."),
  email: emailSchema,
  phone: optionalPhoneSchema.refine((value) => value.trim().length > 0, {
    message: "Phone is required.",
  }),
  cellphone: optionalPhoneSchema.optional().or(z.literal("")),
  company: z
    .string()
    .trim()
    .max(120, "Company must be 120 characters or fewer.")
    .optional()
    .or(z.literal("")),
  status: z.enum(["active", "inactive", "lead"]),
  preferredContactMethod: z.enum(["phone", "email", "text"]).optional(),
  bestContactTime: z
    .string()
    .trim()
    .max(120, "Best contact time must be 120 characters or fewer.")
    .optional()
    .or(z.literal("")),
  customerPreferences: z
    .string()
    .trim()
    .max(240, "Preferences must be 240 characters or fewer.")
    .optional()
    .or(z.literal("")),
});

export const customerPropertySchema = z.object({
  label: z
    .string()
    .trim()
    .min(2, "Property label is required.")
    .max(80, "Property label must be 80 characters or fewer."),
  line1: z
    .string()
    .trim()
    .min(4, "Address is required.")
    .max(120, "Address must be 120 characters or fewer."),
  line2: z
    .string()
    .trim()
    .max(120, "Address line 2 must be 120 characters or fewer.")
    .optional()
    .or(z.literal("")),
  city: z
    .string()
    .trim()
    .min(2, "City is required.")
    .max(80, "City must be 80 characters or fewer."),
  state: z
    .string()
    .trim()
    .min(2, "State is required.")
    .max(40, "State must be 40 characters or fewer."),
  postalCode: z
    .string()
    .trim()
    .min(3, "Postal code is required.")
    .max(20, "Postal code must be 20 characters or fewer."),
  country: z
    .string()
    .trim()
    .min(2, "Country is required.")
    .max(40, "Country must be 40 characters or fewer."),
  propertyType: z.enum([
    "primary-residence",
    "vacation-home",
    "townhouse",
    "apartment",
    "commercial",
    "other",
  ]),
  floors: z
    .number({ error: "Number of floors is required." })
    .int("Floors must be a whole number.")
    .min(1, "At least 1 floor is required.")
    .max(20, "Floors must be 20 or fewer."),
  hasBasement: z.boolean(),
  hasSubBasement: z.boolean(),
  accessInformation: z
    .string()
    .trim()
    .max(240, "Access information must be 240 characters or fewer.")
    .optional()
    .or(z.literal("")),
  internalNotes: z
    .string()
    .trim()
    .max(320, "Internal notes must be 320 characters or fewer.")
    .optional()
    .or(z.literal("")),
});

export const customerUnitSchema = z.object({
  unitNumber: z
    .string()
    .trim()
    .min(2, "Unit number is required.")
    .max(40, "Unit number must be 40 characters or fewer."),
  manufacturer: z
    .string()
    .trim()
    .min(2, "Manufacturer is required.")
    .max(80, "Manufacturer must be 80 characters or fewer."),
  model: z
    .string()
    .trim()
    .min(2, "Model is required.")
    .max(80, "Model must be 80 characters or fewer."),
  serialNumber: z
    .string()
    .trim()
    .max(80, "Serial number must be 80 characters or fewer.")
    .optional()
    .or(z.literal("")),
  location: z
    .string()
    .trim()
    .min(2, "Location is required.")
    .max(120, "Location must be 120 characters or fewer."),
  notes: z
    .string()
    .trim()
    .max(240, "Notes must be 240 characters or fewer.")
    .optional()
    .or(z.literal("")),
});

export const customerInletFloorSchema = z.object({
  label: z
    .string()
    .trim()
    .min(2, "Floor label is required.")
    .max(80, "Floor label must be 80 characters or fewer."),
  hdh: z.number({ error: "HDH count is required." }).int().min(0).max(50),
  chameleon: z.number({ error: "Chameleon count is required." }).int().min(0).max(50),
  chameleonElite: z
    .number({ error: "Chameleon-Elite count is required." })
    .int()
    .min(0)
    .max(50),
  standard: z.number({ error: "Standard count is required." }).int().min(0).max(50),
  notes: z
    .string()
    .trim()
    .max(200, "Notes must be 200 characters or fewer.")
    .optional()
    .or(z.literal("")),
});

export const customerFeatureSchema = z.object({
  type: z.enum(["VacPan", "Spot Vacuum", "Wally Flex"]),
  quantity: z
    .number({ error: "Quantity is required." })
    .int("Quantity must be a whole number.")
    .min(1, "Quantity must be at least 1.")
    .max(50, "Quantity must be 50 or fewer."),
  locations: z
    .string()
    .trim()
    .min(2, "Add at least 1 location.")
    .max(240, "Locations must be 240 characters or fewer."),
  notes: z
    .string()
    .trim()
    .max(200, "Notes must be 200 characters or fewer.")
    .optional()
    .or(z.literal("")),
});

export const customerInternalNoteSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Title is required.")
    .max(80, "Title must be 80 characters or fewer."),
  body: z
    .string()
    .trim()
    .min(8, "Note must be at least 8 characters.")
    .max(500, "Note must be 500 characters or fewer."),
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
export type ProductValues = z.infer<typeof productSchema>;
export type ServiceCatalogValues = z.infer<typeof serviceCatalogSchema>;
export type TechnicianValues = z.infer<typeof technicianSchema>;
export type CustomerOverviewValues = z.infer<typeof customerOverviewSchema>;
export type CustomerPropertyValues = z.infer<typeof customerPropertySchema>;
export type CustomerUnitValues = z.infer<typeof customerUnitSchema>;
export type CustomerInletFloorValues = z.infer<typeof customerInletFloorSchema>;
export type CustomerFeatureValues = z.infer<typeof customerFeatureSchema>;
export type CustomerInternalNoteValues = z.infer<typeof customerInternalNoteSchema>;
export type QuotationBuilderValues = z.infer<typeof quotationBuilderSchema>;
