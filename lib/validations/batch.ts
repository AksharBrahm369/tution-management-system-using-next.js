import { z } from "zod";

/**
 * ─── ENUMS ───────────────────────────────────────────────────────────────────
 */

/**
 * Zod validation schema for DayOfWeek enum.
 * Validates days of the week for scheduling batches.
 */
export const dayOfWeekSchema = z.enum([
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
]);

/**
 * Zod validation schema for BatchStatus enum.
 * Validates the operational status of tuition batches.
 */
export const batchStatusSchema = z.enum([
  "ACTIVE",
  "INACTIVE",
  "COMPLETED",
  "UPCOMING",
  "CANCELLED",
]);

/**
 * Zod validation schema for SessionStatus enum.
 * Validates the status of individual class sessions.
 */
export const sessionStatusSchema = z.enum([
  "SCHEDULED",
  "ONGOING",
  "COMPLETED",
  "CANCELLED",
  "RESCHEDULED",
]);

/**
 * Zod validation schema for HolidayType enum.
 * Validates categories of official holidays.
 */
export const holidayTypeSchema = z.enum([
  "NATIONAL",
  "STATE",
  "INSTITUTE",
  "EXAM",
  "SPECIAL",
]);

/**
 * Zod validation schema for CalendarEventType enum.
 * Validates types of events on the academic calendar.
 */
export const calendarEventTypeSchema = z.enum([
  "EXAM",
  "HOLIDAY",
  "EVENT",
  "PTM",
  "RESULT_DAY",
  "ENROLLMENT",
  "OTHER",
]);

/**
 * ─── BASE PRIMITIVES & HELPERS ───────────────────────────────────────────────
 */

/**
 * Validates standard academic years.
 * Format requirement: YYYY-YY (e.g., "2025-26", "2026-27").
 */
const academicYearSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, "Academic year must follow the YYYY-YY format (e.g., 2025-26)");

/**
 * Validates 24-hour time strings.
 * Format requirement: HH:MM (e.g., "08:30", "16:00").
 */
const timeSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format (24-hour clock)");

/**
 * Coerces and validates required date inputs.
 */
const requiredDateSchema = z.coerce.date({
  message: "Please select a valid date",
});

/**
 * Preprocesses blank inputs to undefined and validates optional dates.
 */
const optionalDateSchema = z.preprocess(
  (val) => (!val ? undefined : val),
  z.coerce.date().optional()
);

/**
 * ─── ROOM VALIDATION SCHEMAS ─────────────────────────────────────────────────
 */

/**
 * Zod schema for validating the creation of a physical classroom or lab.
 */
export const roomCreateSchema = z.object({
  name: z.string().min(2, "Room name must be at least 2 characters long"),
  code: z.string().min(1, "Room code is required and must be unique"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1 student"),
  floor: z.string().optional().or(z.literal("")),
  building: z.string().optional().or(z.literal("")),
  facilities: z.array(z.string()).optional().default([]),
});

/**
 * Zod schema for validating updates to a room.
 */
export const roomUpdateSchema = roomCreateSchema.partial();

/**
 * ─── HOLIDAY VALIDATION SCHEMAS ──────────────────────────────────────────────
 */

/**
 * Zod schema for validating the creation of an official holiday.
 */
export const holidayCreateSchema = z.object({
  name: z.string().min(2, "Holiday name must be at least 2 characters long"),
  date: requiredDateSchema,
  type: holidayTypeSchema,
  description: z.string().optional().or(z.literal("")),
  isRecurring: z.boolean().optional().default(false),
  affectsAll: z.boolean().optional().default(true),
  batchIds: z.array(z.string()).optional().default([]),
});

/**
 * Zod schema for validating updates to a holiday.
 */
export const holidayUpdateSchema = holidayCreateSchema.partial();

/**
 * ─── CALENDAR EVENT VALIDATION SCHEMAS ───────────────────────────────────────
 */

/**
 * Zod schema for validating academic calendar events (exams, events, meetings).
 */
export const calendarEventCreateSchema = z.object({
  title: z.string().min(2, "Event title must be at least 2 characters long"),
  description: z.string().optional().or(z.literal("")),
  startDate: requiredDateSchema,
  endDate: optionalDateSchema,
  type: calendarEventTypeSchema,
  color: z.string().optional(),
  isAllDay: z.boolean().optional().default(true),
  batchIds: z.array(z.string()).optional().default([]),
});

/**
 * Zod schema for validating calendar event updates.
 */
export const calendarEventUpdateSchema = calendarEventCreateSchema.partial();

/**
 * ─── BATCH STEP-BY-STEP SCHEMAS ──────────────────────────────────────────────
 */

/**
 * Batch Creation - Step 1: Basic Details
 * Validates name, code, subject, fees, academic year, and active dates.
 */
export const batchStep1Schema = z.object({
  standardId: z.string().optional().or(z.literal("")),
  name: z.string().min(3, "Batch name must be at least 3 characters long"),
  code: z.string().optional().or(z.literal("")),
  subjectId: z.string().min(1, "Please select a valid subject"),
  academicYear: academicYearSchema,
  description: z.string().optional().or(z.literal("")),
  color: z.string().optional().or(z.literal("")),
  fees: z.coerce.number().min(0, "Fees cannot be a negative amount").optional().default(0),
  maxStrength: z.coerce.number().min(1, "Maximum strength must be at least 1 student").default(30),
  startDate: requiredDateSchema,
  endDate: optionalDateSchema,
  isOnline: z.boolean().optional().default(false),
  meetingLink: z.string().optional().or(z.literal("")),
});

/**
 * Batch Creation - Step 2: Schedule & Teacher
 * Validates days of the week, timing slots, teacher assignment, and classroom.
 */
export const batchStep2Schema = z.object({
  days: z.array(dayOfWeekSchema).min(1, "Please select at least one day for classes"),
  startTime: timeSchema,
  endTime: timeSchema,
  teacherId: z.string().min(1, "Please assign a teacher to this batch"),
  roomId: z.string().optional().or(z.literal("")),
});

/**
 * Batch Creation - Step 3: Student Enrollments
 * Holds initial students assigned during creation.
 */
export const batchStep3Schema = z.object({
  studentIds: z.array(z.string()).optional().default([]),
  skipEnrollment: z.boolean().optional().default(false),
});

/**
 * Batch Creation - Step 4: Configurations
 * Validates options like automatic class session generation.
 */
export const batchStep4Schema = z.object({
  generateSessions: z.boolean().optional().default(true),
});

/**
 * Consolidated Batch Creation Schema
 * Merges Steps 1 through 4 into a unified validation object.
 */
export const batchCreateSchema = batchStep1Schema
  .merge(batchStep2Schema)
  .merge(batchStep3Schema)
  .merge(batchStep4Schema);

/**
 * Consolidated Batch Update Schema
 * Allows partial updates, schedule change detection, and session generation flags.
 */
export const batchUpdateSchema = batchStep1Schema
  .merge(batchStep2Schema)
  .partial()
  .extend({
    scheduleChanged: z.boolean().optional().default(false),
    generateSessions: z.boolean().optional().default(false),
  });

/**
 * ─── CLASS SESSION VALIDATION SCHEMAS ────────────────────────────────────────
 */

/**
 * Zod schema for manual creation of a Class Session.
 */
export const sessionCreateSchema = z.object({
  standardId: z.string().optional().or(z.literal("")),
  batchId: z.string().min(1, "Batch ID is required"),
  date: requiredDateSchema,
  startTime: timeSchema,
  endTime: timeSchema,
  topic: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  homework: z.string().optional().or(z.literal("")),
  roomId: z.string().optional().or(z.literal("")),
});

/**
 * Zod schema for updating details of a Class Session.
 */
export const sessionUpdateSchema = z.object({
  topic: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  homework: z.string().optional().or(z.literal("")),
  status: sessionStatusSchema.optional(),
});

/**
 * Zod schema for cancelling a Class Session.
 */
export const sessionCancelSchema = z.object({
  reason: z.string().min(3, "Cancellation reason must be at least 3 characters"),
  notifyStudents: z.boolean().optional().default(false),
});

/**
 * Zod schema for rescheduling a Class Session.
 */
export const sessionRescheduleSchema = z.object({
  newDate: requiredDateSchema,
  newStartTime: timeSchema,
  newEndTime: timeSchema,
  newRoomId: z.string().optional().or(z.literal("")),
  reason: z.string().min(3, "Rescheduling reason must be at least 3 characters"),
  notifyStudents: z.boolean().optional().default(false),
});

/**
 * Zod schema for assigning a substitute teacher to a session.
 */
export const sessionSubstituteSchema = z.object({
  substituteId: z.string().min(1, "Please select a substitute teacher"),
  notifySubstitute: z.boolean().optional().default(true),
});

/**
 * ─── STUDENT ENROLLMENT SCHEMAS ──────────────────────────────────────────────
 */

/**
 * Zod schema for enrolling one or more students into a batch.
 */
export const enrollStudentsSchema = z.object({
  studentIds: z.array(z.string()).min(1, "Please select at least one student to enroll"),
  notes: z.string().optional().or(z.literal("")),
});

/**
 * Zod schema for removing a student from a batch.
 */
export const removeStudentSchema = z.object({
  reason: z.string().min(3, "Reason for withdrawal must be at least 3 characters"),
  leaveDate: optionalDateSchema,
});

/**
 * ─── TS TYPES INFERRED FROM SCHEMAS ──────────────────────────────────────────
 */

export type BatchCreateInput = z.infer<typeof batchCreateSchema>;
export type BatchUpdateInput = z.infer<typeof batchUpdateSchema>;
export type BatchStep1Input = z.infer<typeof batchStep1Schema>;
export type BatchStep2Input = z.infer<typeof batchStep2Schema>;
export type BatchStep3Input = z.infer<typeof batchStep3Schema>;
export type BatchStep4Input = z.infer<typeof batchStep4Schema>;
export type RoomCreateInput = z.infer<typeof roomCreateSchema>;
export type RoomUpdateInput = z.infer<typeof roomUpdateSchema>;
export type HolidayCreateInput = z.infer<typeof holidayCreateSchema>;
export type SessionCreateInput = z.infer<typeof sessionCreateSchema>;
export type SessionUpdateInput = z.infer<typeof sessionUpdateSchema>;
export type SessionCancelInput = z.infer<typeof sessionCancelSchema>;
export type SessionRescheduleInput = z.infer<typeof sessionRescheduleSchema>;
export type SessionSubstituteInput = z.infer<typeof sessionSubstituteSchema>;
export type EnrollStudentsInput = z.infer<typeof enrollStudentsSchema>;
export type RemoveStudentInput = z.infer<typeof removeStudentSchema>;
export type CalendarEventCreateInput = z.infer<typeof calendarEventCreateSchema>;
