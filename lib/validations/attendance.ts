import { z } from "zod";
import { AttendanceStatus } from "@prisma/client";

// Attendance status enum
export const AttendanceStatusEnum = z.enum([
  "PRESENT",
  "ABSENT",
  "LATE",
  "HALF_DAY",
  "ON_LEAVE",
  "HOLIDAY",
  "CANCELLED",
] as const);

// Single attendance record input
export const AttendanceRecordSchema = z.object({
  studentId: z.string().cuid("Invalid student ID"),
  status: AttendanceStatusEnum,
  lateMinutes: z.number().int().positive().optional(),
  arrivalTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format").optional(),
  leaveReason: z.string().min(2).max(500).optional(),
  notes: z.string().max(1000).optional(),
});

// Mark attendance request
export const MarkAttendanceSchema = z.object({
  batchId: z.string().cuid("Invalid batch ID"),
  date: z.string().datetime().or(z.date()),
  attendance: z.array(AttendanceRecordSchema).min(1, "At least one attendance record required"),
  sessionId: z.string().cuid("Invalid session ID").optional(),
  notifyParents: z.boolean().default(false),
});

// Correct attendance request
export const CorrectAttendanceSchema = z.object({
  attendanceId: z.string().cuid("Invalid attendance ID"),
  newStatus: AttendanceStatusEnum,
  reason: z.string().min(5).max(500, "Correction reason is required"),
});

// Attendance filters for queries
export const AttendanceFiltersSchema = z.object({
  batchId: z.string().cuid().optional(),
  studentId: z.string().cuid().optional(),
  date: z.string().datetime().or(z.date()).optional(),
  fromDate: z.string().datetime().or(z.date()).optional(),
  toDate: z.string().datetime().or(z.date()).optional(),
  status: AttendanceStatusEnum.optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(50),
});

// QR scan validation
export const QRScanSchema = z.object({
  qrToken: z.string().min(20),
});

// Generate QR code request
export const GenerateQRSchema = z.object({
  batchId: z.string().cuid("Invalid batch ID"),
  date: z.string().datetime().or(z.date()).optional(),
  sessionId: z.string().cuid().optional(),
});

// Attendance alert request
export const AttendanceAlertSchema = z.object({
  type: z.enum(["critical", "warning", "all"]).default("all"),
});

// Bulk remind request
export const BulkRemindSchema = z.object({
  studentIds: z.array(z.string().cuid()).optional(),
  channels: z
    .array(z.enum(["whatsapp", "sms", "email"]))
    .min(1)
    .default(["whatsapp"]),
  threshold: z.number().int().min(0).max(100).default(75),
});

// Export types
export type AttendanceRecord = z.infer<typeof AttendanceRecordSchema>;
export type MarkAttendanceInput = z.infer<typeof MarkAttendanceSchema>;
export type CorrectAttendanceInput = z.infer<typeof CorrectAttendanceSchema>;
export type AttendanceFilters = z.infer<typeof AttendanceFiltersSchema>;
export type QRScanInput = z.infer<typeof QRScanSchema>;
export type GenerateQRInput = z.infer<typeof GenerateQRSchema>;
export type AttendanceAlertInput = z.infer<typeof AttendanceAlertSchema>;
export type BulkRemindInput = z.infer<typeof BulkRemindSchema>;

/**
 * Validate attendance record
 */
export function validateAttendanceRecord(data: unknown) {
  return AttendanceRecordSchema.safeParse(data);
}

/**
 * Validate mark attendance request
 */
export function validateMarkAttendance(data: unknown) {
  return MarkAttendanceSchema.safeParse(data);
}

/**
 * Validate correction request
 */
export function validateCorrectAttendance(data: unknown) {
  return CorrectAttendanceSchema.safeParse(data);
}

/**
 * Validate QR scan
 */
export function validateQRScan(data: unknown) {
  return QRScanSchema.safeParse(data);
}

/**
 * Validate generate QR request
 */
export function validateGenerateQR(data: unknown) {
  return GenerateQRSchema.safeParse(data);
}

/**
 * Validate attendance filters
 */
export function validateAttendanceFilters(data: unknown) {
  return AttendanceFiltersSchema.safeParse(data);
}

/**
 * Validate alert request
 */
export function validateAttendanceAlert(data: unknown) {
  return AttendanceAlertSchema.safeParse(data);
}

/**
 * Validate bulk remind request
 */
export function validateBulkRemind(data: unknown) {
  return BulkRemindSchema.safeParse(data);
}
