import { z } from "zod";

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
  grade: z.string().min(1),
  minPercentage: z.number().min(0).max(100),
  maxPercentage: z.number().min(0).max(100),
  gradePoint: z.number().min(0),
  remark: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
});

const examQuestionSchema = z.object({
  questionNumber: z.number().int().positive(),
  questionText: z.string().min(1),
  questionType: questionTypeSchema,
  marks: z.number().positive(),
  negativeMarks: z.number().min(0).default(0),
  optionA: z.string().nullable().optional(),
  optionB: z.string().nullable().optional(),
  optionC: z.string().nullable().optional(),
  optionD: z.string().nullable().optional(),
  correctOption: z.string().nullable().optional(),
  modelAnswer: z.string().nullable().optional(),
  answerKeyPoints: z.array(z.string()).default([]),
  topic: z.string().nullable().optional(),
  difficulty: difficultySchema.default("MEDIUM"),
});

export const examCreateSchema = z.object({
  title: z.string().min(1),
  code: z.string().optional(),
  description: z.string().nullable().optional(),
  type: examTypeSchema,
  batchId: z.string().min(1, "Please select a batch"),
  subjectId: z.string().min(1, "Please select a subject"),
  academicYear: z.string().min(1),
  examDate: z.coerce.date({
    required_error: "Please select a valid exam date",
    invalid_type_error: "Please select a valid exam date",
  }),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
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
  examDate: z.coerce.date({
    required_error: "Please select a valid exam date",
    invalid_type_error: "Please select a valid exam date",
  }).optional(),
});

export const marksSubmitSchema = z.object({
  results: z.array(
    z.object({
      studentId: z.string().min(1),
      marksObtained: z.number().min(0).nullable(),
      isAbsent: z.boolean().default(false),
      isDisqualified: z.boolean().default(false),
      disqualifyReason: z.string().nullable().optional(),
      teacherRemarks: z.string().nullable().optional(),
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
