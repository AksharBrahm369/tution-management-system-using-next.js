import { z } from "zod";

const nullableString = z.string().nullable().optional().or(z.literal(""));

export const backupTypeSchema = z.enum(["MANUAL", "SCHEDULED", "AUTO"]);

export const testConnectionSchema = z.object({
  integration: z.enum(["twilio", "razorpay"]),
});

export const instituteSettingsSchema = z.object({
  name: z.string().min(2, "Institute name is required"),
  tagline: nullableString,
  description: nullableString,
  logo: nullableString,
  favicon: nullableString,
  phone: nullableString,
  alternatePhone: nullableString,
  email: nullableString,
  website: nullableString,
  addressLine1: nullableString,
  addressLine2: nullableString,
  city: nullableString,
  state: nullableString,
  pincode: nullableString,
  country: z.string().min(2).default("India"),
  currentAcademicYear: z.string().min(4, "Current academic year is required"),
  academicYears: z.array(z.string().min(1)).default([]),
  workingDays: z.array(z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"])).default([]),
  workingHours: z.record(z.string(), z.any()).optional().nullable(),
  gstEnabled: z.boolean().default(false),
  gstNumber: nullableString,
  gstPercentage: z.coerce.number().min(0).max(100).default(18),
  panNumber: nullableString,
  receiptPrefix: z.string().min(1).default("RCP"),
  receiptStartNumber: z.string().min(1).default("001"),
  receiptFooterText: nullableString,
  razorpayKeyId: nullableString,
  razorpayKeySecret: nullableString,
  razorpayMode: z.enum(["TEST", "LIVE"]).default("TEST"),
  twilioAccountSid: nullableString,
  twilioAuthToken: nullableString,
  twilioWhatsAppNumber: nullableString,
  cloudinaryCloudName: nullableString,
  cloudinaryApiKey: nullableString,
  cloudinaryApiSecret: nullableString,
  firebaseProjectId: nullableString,
  firebaseApiKey: nullableString,
  passwordMinLength: z.coerce.number().int().min(6).default(8),
  requireUppercase: z.boolean().default(true),
  requireNumber: z.boolean().default(true),
  requireSpecialChar: z.boolean().default(true),
  passwordExpiryDays: z.coerce.number().int().min(0).default(90),
  sessionTimeoutMinutes: z.coerce.number().int().min(1).default(30),
  rememberMeDays: z.coerce.number().int().min(0).default(7),
  maxFailedAttempts: z.coerce.number().int().min(1).default(5),
  lockoutDurationMinutes: z.coerce.number().int().min(1).default(30),
  twoFactorEnabled: z.boolean().default(false),
  autoBackupEnabled: z.boolean().default(false),
  backupFrequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]).default("WEEKLY"),
  backupTime: nullableString,
  backupRetention: z.coerce.number().int().min(1).default(10),
  currency: z.string().min(1).default("INR"),
  dateFormat: z.string().min(1).default("DD/MM/YYYY"),
  timeFormat: z.string().min(1).default("12H"),
  language: z.string().min(1).default("EN"),
  timezone: z.string().min(1).default("Asia/Kolkata"),
  primaryColor: z.string().min(4).default("#2563EB"),
  secondaryColor: z.string().min(4).default("#10B981"),
  onlinePaymentEnabled: z.boolean().default(false),
  qrAttendanceEnabled: z.boolean().default(true),
  parentPortalEnabled: z.boolean().default(true),
  studentPortalEnabled: z.boolean().default(true),
});

export const academicYearSchema = z.object({
  name: z.string().min(4, "Year name is required"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isCurrent: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const backupCreateSchema = z.object({
  type: backupTypeSchema.default("MANUAL"),
});

export const restoreSchema = z.object({
  settings: instituteSettingsSchema.optional(),
  academicYears: z.array(academicYearSchema).optional(),
});

export type InstituteSettingsInput = z.infer<typeof instituteSettingsSchema>;
export type AcademicYearInput = z.infer<typeof academicYearSchema>;
export type BackupCreateInput = z.infer<typeof backupCreateSchema>;
export type RestoreInput = z.infer<typeof restoreSchema>;
