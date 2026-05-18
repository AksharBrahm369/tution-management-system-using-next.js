import { z } from "zod";

export const examSchema = z.object({
  title: z.string().min(1, "Title is required"),
  code: z.string().optional(),
  description: z.string().optional(),
  type: z.enum([
    "UNIT_TEST", "MID_TERM", "FINAL", "MOCK_TEST",
    "CLASS_TEST", "ASSIGNMENT", "PRACTICAL", "ONLINE_TEST"
  ]),
  batchId: z.string().min(1, "Batch is required"),
  subjectId: z.string().min(1, "Subject is required"),
  academicYear: z.string().min(1, "Academic year is required"),
  
  examDate: z.date({ required_error: "Date is required" }),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  duration: z.number().optional(),

  totalMarks: z.number().min(1, "Total marks must be greater than 0"),
  passingMarks: z.number().min(0, "Passing marks must be >= 0"),
  
  hasNegativeMarking: z.boolean().default(false),
  negativeMarkValue: z.number().default(0),

  gradingSystem: z.enum(["PERCENTAGE", "GRADE_POINTS", "MARKS", "PASS_FAIL"]),
  gradeConfig: z.any().optional(),

  questions: z.array(z.object({
    questionText: z.string().min(1, "Question text required"),
    questionType: z.enum(["MCQ", "SHORT_ANSWER", "LONG_ANSWER", "TRUE_FALSE", "FILL_BLANK", "MATCH"]),
    marks: z.number().min(0.5, "Marks > 0 required"),
    negativeMarks: z.number().optional(),
    optionA: z.string().optional(),
    optionB: z.string().optional(),
    optionC: z.string().optional(),
    optionD: z.string().optional(),
    correctOption: z.string().optional(),
    modelAnswer: z.string().optional(),
    answerKeyPoints: z.array(z.string()).optional(),
    topic: z.string().optional(),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM")
  })).optional(),
});

export const marksEntrySchema = z.object({
  results: z.array(z.object({
    studentId: z.string(),
    marksObtained: z.number().nullable(),
    isAbsent: z.boolean(),
    teacherRemarks: z.string().optional(),
    weakAreas: z.array(z.string()).optional()
  })),
  calculateRanks: z.boolean().default(false),
  publishNow: z.boolean().default(false),
  notifyParents: z.boolean().default(false)
});
