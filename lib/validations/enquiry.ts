import { z } from "zod";

const indianPhoneSchema = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const digitsOnly = value.replace(/\D/g, "");
  if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    return digitsOnly.slice(2);
  }

  return digitsOnly;
}, z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid Indian phone number"));

const nullableString = z.string().optional().or(z.literal(""));

export const enquirySourceSchema = z.enum([
  "WALK_IN",
  "PHONE_CALL",
  "WHATSAPP",
  "WEBSITE",
  "SOCIAL_MEDIA",
  "REFERRAL",
  "NEWSPAPER",
  "PAMPHLET",
  "OTHER",
]);

export const enquiryStatusSchema = z.enum([
  "NEW",
  "CONTACTED",
  "DEMO_SCHEDULED",
  "DEMO_DONE",
  "INTERESTED",
  "NOT_INTERESTED",
  "CONVERTED",
  "LOST",
  "ON_HOLD",
]);

export const prioritySchema = z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]);
export const followUpTypeSchema = z.enum(["CALL", "WHATSAPP", "EMAIL", "VISIT", "DEMO"]);
export const followUpStatusSchema = z.enum(["PENDING", "COMPLETED", "MISSED", "RESCHEDULED"]);
export const demoStatusSchema = z.enum(["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"]);

const interestedInSchema = z.preprocess(
  (value) => {
    if (Array.isArray(value)) {
      return value.filter((item) => typeof item === "string" && item.trim().length > 0);
    }

    if (typeof value === "string") {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [];
  },
  z.array(z.string()).default([])
);

export const enquiryCreateSchema = z.object({
  studentName: z.string().min(2, "Student name is required"),
  studentAge: z.coerce.number().int().positive().max(30).optional(),
  studentClass: nullableString,
  parentName: z.string().min(2, "Parent name is required"),
  parentPhone: indianPhoneSchema,
  parentEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  address: nullableString,
  interestedIn: interestedInSchema,
  preferredBatch: nullableString,
  preferredTime: nullableString,
  source: enquirySourceSchema,
  sourceDetail: nullableString,
  referredBy: nullableString,
  status: enquiryStatusSchema.optional(),
  priority: prioritySchema.optional(),
  assignedTo: nullableString,
  notes: nullableString,
  followUpScheduledAt: z.coerce.date().optional(),
  followUpType: followUpTypeSchema.optional(),
});

export const enquiryUpdateSchema = enquiryCreateSchema.partial().extend({
  enquiryNumber: z.string().optional(),
  isConverted: z.boolean().optional(),
  convertedAt: z.coerce.date().optional().nullable(),
  studentId: z.string().optional().nullable(),
});

export const enquiryStatusUpdateSchema = z.object({
  status: enquiryStatusSchema,
});

export const followUpCreateSchema = z.object({
  type: followUpTypeSchema,
  scheduledAt: z.coerce.date(),
  completedAt: z.coerce.date().optional().nullable(),
  status: followUpStatusSchema.optional(),
  notes: nullableString,
  outcome: nullableString,
  nextFollowUpAt: z.coerce.date().optional().nullable(),
  doneBy: nullableString,
});

export const demoCreateSchema = z.object({
  batchId: z.string().optional().nullable(),
  scheduledDate: z.coerce.date(),
  scheduledTime: z.string().min(1, "Scheduled time is required"),
  status: demoStatusSchema.optional(),
  teacherNotes: nullableString,
  parentFeedback: nullableString,
  interested: z.boolean().optional(),
});

export const convertEnquirySchema = z.object({
  batchId: z.string().min(1, "Batch is required"),
  joiningDate: z.coerce.date(),
});

export const enquiryFiltersSchema = z.object({
  search: z.string().optional(),
  status: enquiryStatusSchema.optional(),
  source: enquirySourceSchema.optional(),
  assignedTo: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export type EnquiryCreateInput = z.infer<typeof enquiryCreateSchema>;
export type EnquiryUpdateInput = z.infer<typeof enquiryUpdateSchema>;
export type EnquiryStatusInput = z.infer<typeof enquiryStatusUpdateSchema>;
export type FollowUpCreateInput = z.infer<typeof followUpCreateSchema>;
export type DemoCreateInput = z.infer<typeof demoCreateSchema>;
export type ConvertEnquiryInput = z.infer<typeof convertEnquirySchema>;
export type EnquiryFiltersInput = z.infer<typeof enquiryFiltersSchema>;
