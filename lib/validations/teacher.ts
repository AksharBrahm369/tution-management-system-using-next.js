import * as z from "zod";

export const teacherSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number is required"),
  alternatePhone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  bloodGroup: z.enum(["A_POSITIVE", "A_NEGATIVE", "B_POSITIVE", "B_NEGATIVE", "AB_POSITIVE", "AB_NEGATIVE", "O_POSITIVE", "O_NEGATIVE"]).optional(),
  
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  
  qualification: z.string().optional(),
  specialization: z.string().optional(),
  experience: z.number().int().nonnegative().optional(),
  joiningDate: z.string().optional(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "VISITING", "CONTRACT"]).default("FULL_TIME"),
  
  salaryType: z.enum(["FIXED", "PER_CLASS", "PER_STUDENT", "MIXED"]).default("FIXED"),
  fixedSalary: z.number().nonnegative().optional(),
  perClassRate: z.number().nonnegative().optional(),
  perStudentRate: z.number().nonnegative().optional(),
  
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  upiId: z.string().optional(),
  
  subjectIds: z.array(z.string()).min(1, "At least one subject is required"),
});
