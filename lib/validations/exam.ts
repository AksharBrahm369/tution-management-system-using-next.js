import { z } from "zod";

const emptyStringToUndefined = z
  .string()
  .transform((value) => (value.trim() === "" ? undefined : value.trim()));

const examTypeSchema = z.enum([
  "UNIT_TEST",
  "MID_TERM",
  "FINAL",
  "MOCK_TEST",
  "CLASS_TEST",
  "ASSIGNMENT",
  "PRACTICAL",
  "ONLINE_TEST",
]);

const gradingSystemSchema = z.enum(["PERCENTAGE", "GRADE_POINTS", "MARKS", "PASS_FAIL"]);
const examStatusSchema = z.enum(["UPCOMING", "ONGOING", "COMPLETED", "CANCELLED", "RESULT_PENDING", "RESULT_PUBLISHED"]);
const questionTypeSchema = z.enum(["MCQ", "SHORT_ANSWER", "LONG_ANSWER", "TRUE_FALSE", "FILL_BLANK", "MATCH"]);
const difficultySchema = z.enum(["EASY", "MEDIUM", "HARD"]);

const gradeRangeSchema = z.object({
  grade: z.string().trim().min(1, "Grade is required"),
  minPercentage: z.number().min(0).max(100),
  maxPercentage: z.number().min(0).max(100),
  gradePoint: z.number().min(0),
  remark: z.preprocess((value) => (typeof value === "string" && value.trim() === "" ? undefined : value), z.string().nullable().optional()),
  color: z.preprocess((value) => (typeof value === "string" && value.trim() === "" ? undefined : value), z.string().nullable().optional()),
});

const examQuestionSchema = z.object({
  questionNumber: z.number().int().positive(),
  questionText: z.string().trim().min(1, "Question text is required"),
  questionType: questionTypeSchema,
  marks: z.number().positive(),
  negativeMarks: z.number().min(0).default(0),
  optionA: z.preprocess((value) => (typeof value === "string" && value.trim() === "" ? undefined : value), z.string().nullable().optional()),
  optionB: z.preprocess((value) => (typeof value === "string" && value.trim() === "" ? undefined : value), z.string().nullable().optional()),
  optionC: z.preprocess((value) => (typeof value === "string" && value.trim() === "" ? undefined : value), z.string().nullable().optional()),
  optionD: z.preprocess((value) => (typeof value === "string" && value.trim() === "" ? undefined : value), z.string().nullable().optional()),
  correctOption: z.preprocess((value) => (typeof value === "string" && value.trim() === "" ? undefined : value), z.string().nullable().optional()),
  modelAnswer: z.preprocess((value) => (typeof value === "string" && value.trim() === "" ? undefined : value), z.string().nullable().optional()),
  answerKeyPoints: z.array(z.string()).default([]),
  topic: z.preprocess((value) => (typeof value === "string" && value.trim() === "" ? undefined : value), z.string().nullable().optional()),
  difficulty: difficultySchema.default("MEDIUM"),
});

export const examCreateSchema = z.object({
  title: z.string().trim().min(1, "Exam title is required"),
  code: z.preprocess((value) => (typeof value === "string" && value.trim() === "" ? undefined : value), z.string().optional()),
  description: z.preprocess((value) => (typeof value === "string" && value.trim() === "" ? undefined : value), z.string().nullable().optional()),
  type: examTypeSchema,
  batchId: z.string().trim().min(1, "Please select a batch"),
  subjectId: z.string().trim().min(1, "Please select a subject"),
  academicYear: z.string().trim().min(1, "Academic year is required"),
  examDate: z.preprocess(
    (val) => (val ? new Date(val as any) : val),
    z.date({
      message: "Please select a valid exam date",
    })
  ),
  startTime: z.preprocess((value) => (typeof value === "string" && value.trim() === "" ? undefined : value), z.string().nullable().optional()),
  endTime: z.preprocess((value) => (typeof value === "string" && value.trim() === "" ? undefined : value), z.string().nullable().optional()),
  duration: z.number().int().min(0).nullable().optional(),
  totalMarks: z.number().positive(),
  passingMarks: z.number().min(0),
  hasNegativeMarking: z.boolean().default(false),
  negativeMarkValue: z.number().min(0).default(0),
  gradingSystem: gradingSystemSchema.default("PERCENTAGE"),
  gradeConfig: z.array(gradeRangeSchema).optional(),
  status: examStatusSchema.default("UPCOMING"),
  questions: z.array(examQuestionSchema).default([]),
});

export const examUpdateSchema = examCreateSchema.partial().extend({
  examDate: z.preprocess(
    (val) => (val ? new Date(val as any) : val),
    z.date({
      message: "Please select a valid exam date",
    })
  ).optional(),
});

export const marksSubmitSchema = z.object({
  results: z.array(
    z.object({
      studentId: z.string().trim().min(1, "Student is required"),
      marksObtained: z.number().min(0).nullable(),
      isAbsent: z.boolean().default(false),
      isDisqualified: z.boolean().default(false),
      disqualifyReason: z.preprocess((value) => (typeof value === "string" && value.trim() === "" ? undefined : value), z.string().nullable().optional()),
      teacherRemarks: z.preprocess((value) => (typeof value === "string" && value.trim() === "" ? undefined : value), z.string().nullable().optional()),
      strengthAreas: z.array(z.string()).default([]),
      weakAreas: z.array(z.string()).default([]),
    })
  ),
  calculateRanks: z.boolean().default(true),
  publishNow: z.boolean().default(false),
  notifyParents: z.boolean().default(false),
});

export const marksEntrySchema = z.object({
  results: z.array(
    z.object({
      studentId: z.string(),
      marksObtained: z.number().nullable(),
      isAbsent: z.boolean(),
      teacherRemarks: z.string().optional(),
      weakAreas: z.array(z.string()).optional(),
    })
  ),
  calculateRanks: z.boolean().default(false),
  publishNow: z.boolean().default(false),
  notifyParents: z.boolean().default(false),
});
