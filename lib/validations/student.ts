import { z } from "zod";

const indianPhoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, "Please enter a valid Indian phone number")
  .optional()
  .or(z.literal(""));

const requiredIndianPhoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, "Please enter a valid Indian phone number");

const dateSchema = z.coerce.date().optional();

const optionalBlankToUndefinedDateSchema = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.coerce.date().optional()
);

const optionalBlankToUndefinedEnum = (schema: z.ZodTypeAny) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema.optional());

const academicYearSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, "Academic year must be like 2025-26");

export const genderSchema = z.enum(["MALE", "FEMALE", "OTHER"]);
export const bloodGroupSchema = z.enum([
  "A_POSITIVE",
  "A_NEGATIVE",
  "B_POSITIVE",
  "B_NEGATIVE",
  "AB_POSITIVE",
  "AB_NEGATIVE",
  "O_POSITIVE",
  "O_NEGATIVE",
]);
export const studentStatusSchema = z.enum([
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
  "GRADUATED",
  "TRANSFERRED",
  "ON_LEAVE",
]);
export const studentCategorySchema = z.enum([
  "WEAK",
  "AVERAGE",
  "GOOD",
  "TOPPER",
]);
export const documentTypeSchema = z.enum([
  "BIRTH_CERTIFICATE",
  "SCHOOL_LEAVING",
  "MARKSHEET",
  "ID_PROOF",
  "ADDRESS_PROOF",
  "MEDICAL",
  "PHOTO",
  "OTHER",
]);

const emergencyContactSchema = z.object({
  name: z.string().min(2, "Contact name is required"),
  relationship: z.string().min(2, "Relationship is required"),
  phone: requiredIndianPhoneSchema,
});

export const studentStep1Schema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: indianPhoneSchema,
  dateOfBirth: optionalBlankToUndefinedDateSchema,
  gender: genderSchema,
  bloodGroup: optionalBlankToUndefinedEnum(bloodGroupSchema),
  academicYear: academicYearSchema,
  profilePhoto: z.string().optional(),
});

export const studentStep2Schema = z.object({
  addressLine1: z.string().optional().or(z.literal("")),
  addressLine2: z.string().optional().or(z.literal("")),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().optional().or(z.literal("")),
  fatherName: z.string().optional().or(z.literal("")),
  fatherPhone: indianPhoneSchema,
  fatherEmail: z.string().email("Invalid father email").optional().or(z.literal("")),
  fatherOccup: z.string().optional().or(z.literal("")),
  motherName: z.string().optional().or(z.literal("")),
  motherPhone: indianPhoneSchema,
  motherEmail: z.string().email("Invalid mother email").optional().or(z.literal("")),
  motherOccup: z.string().optional().or(z.literal("")),
  guardianName: z.string().optional().or(z.literal("")),
  guardianPhone: indianPhoneSchema,
  guardianRel: z.string().optional().or(z.literal("")),
  primaryContact: z.enum(["FATHER", "MOTHER", "GUARDIAN"]),
});

export const studentStep3Schema = z.object({
  previousSchool: z.string().optional().or(z.literal("")),
  previousClass: z.string().optional().or(z.literal("")),
  previousMarks: z.string().optional().or(z.literal("")),
  joiningDate: z.coerce.date(),
  category: studentCategorySchema,
  referredBy: z.string().optional().or(z.literal("")),
  batchIds: z.preprocess(
    (value) => {
      if (Array.isArray(value)) {
        return value.filter((entry) => typeof entry === "string" ? entry.trim().length > 0 : Boolean(entry));
      }

      return value === "" ? [] : value;
    },
    z.array(z.string()).optional()
  ),
  notes: z.string().optional().or(z.literal("")),
});

export const studentStep4Schema = z.object({
  emergencyContacts: z.array(emergencyContactSchema).min(1, "Add at least one emergency contact"),
  addMedicalInfo: z.boolean().optional(),
  allergies: z.string().optional().or(z.literal("")),
  medications: z.string().optional().or(z.literal("")),
  conditions: z.string().optional().or(z.literal("")),
  doctorName: z.string().optional().or(z.literal("")),
  doctorPhone: indianPhoneSchema,
  insuranceInfo: z.string().optional().or(z.literal("")),
  extraNotes: z.string().optional().or(z.literal("")),
  siblingIds: z.array(z.string()).optional(),
});

export const studentCreateSchema = studentStep1Schema
  .merge(studentStep2Schema)
  .merge(studentStep3Schema)
  .merge(studentStep4Schema)
  .extend({
    studentCode: z.preprocess((value) => (value === "" ? undefined : value), z.string().optional()),
    status: studentStatusSchema.optional(),
    createStudentLogin: z.preprocess((val) => val === true || val === "true" || val === "on", z.boolean().optional()),
    createParentLogin: z.preprocess((val) => val === true || val === "true" || val === "on", z.boolean().optional()),
  });

export const studentUpdateSchema = studentCreateSchema.partial().extend({
  studentCode: z.preprocess((value) => (value === "" ? undefined : value), z.string().optional()),
});

export const studentStatusUpdateSchema = z.object({
  status: studentStatusSchema,
  reason: z.string().min(3, "Reason is required"),
  effectiveDate: z.coerce.date().optional(),
});

export type StudentCreateInput = z.infer<typeof studentCreateSchema>;
export type StudentUpdateInput = z.infer<typeof studentUpdateSchema>;
export type StudentStatusUpdateInput = z.infer<typeof studentStatusUpdateSchema>;
export type StudentStep1Input = z.infer<typeof studentStep1Schema>;
export type StudentStep2Input = z.infer<typeof studentStep2Schema>;
export type StudentStep3Input = z.infer<typeof studentStep3Schema>;
export type StudentStep4Input = z.infer<typeof studentStep4Schema>;
