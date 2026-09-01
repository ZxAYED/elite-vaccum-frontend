import { z } from "zod";

const minimumRequestedDate = "2026-08-12";

const acceptedMediaTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime",
] as const;

export const serviceRequestSchema = z
  .object({
    serviceSlug: z.string().min(1),
    serviceTitle: z.string().min(1),
    fullName: z.string().min(2, "Enter your full name."),
    email: z.string().email("Enter a valid email address."),
    phone: z.string().min(7, "Enter a valid phone number."),
    address: z.string().min(4, "Enter the service address."),
    city: z.string().min(2, "Enter the city."),
    state: z.string().min(2, "Enter the state."),
    zipCode: z.string().min(4, "Enter the ZIP code."),
    problemLocation: z.string().min(1, "Choose where the issue is located."),
    otherProblemLocation: z.string().optional(),
    requestedDate: z
      .string()
      .min(1, "Choose the requested service date.")
      .refine((value) => value >= minimumRequestedDate, {
        message: "Choose a date that is today or later.",
      }),
    requestedTime: z.string().min(1, "Choose the requested time window."),
    problemDescription: z
      .string()
      .min(20, "Describe the issue in at least 20 characters."),
    symptoms: z.array(z.string()).default([]),
    manufacturer: z.string().optional(),
    modelNumber: z.string().optional(),
    serialNumber: z.string().optional(),
    unitLocation: z.string().optional(),
    additionalNotes: z.string().optional(),
    media: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          size: z.number(),
          type: z.enum(acceptedMediaTypes),
          previewUrl: z.string(),
          file: z.custom<File>().optional(),
        }),
      )
      .max(8, "Upload up to 8 files."),
  })
  .superRefine((values, context) => {
    if (
      values.problemLocation === "Other" &&
      !values.otherProblemLocation?.trim()
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["otherProblemLocation"],
        message: "Describe where the problem is located.",
      });
    }
  });

export type ServiceRequestFormValues = z.input<typeof serviceRequestSchema>;

export const mediaConstraints = {
  acceptedMediaTypes,
  maxFileSizeBytes: 50 * 1024 * 1024,
  maxFiles: 8,
  minimumRequestedDate,
};
