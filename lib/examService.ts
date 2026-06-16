import { Prisma, ResultStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateNextExamCode } from "@/lib/examCode";
import { calculateGrade, defaultGradeRanges, GradeRangeInput } from "@/lib/gradeCalculator";
import { calculateBatchRanks, calculateOverallRanks } from "@/lib/rankCalculator";
import { examCreateSchema, examUpdateSchema, marksSubmitSchema } from "@/lib/validations/exam";

import { z } from "zod";

export type ExamCreateInput = z.infer<typeof examCreateSchema>;
export type ExamUpdateInput = z.infer<typeof examUpdateSchema>;
export type MarksSubmitInput = z.infer<typeof marksSubmitSchema>;

export interface ExamFilters {
  search?: string;
  status?: string;
  type?: string;
  batchId?: string;
  subjectId?: string;
  standardId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  instituteId?: string;
}

export function getGradeRangesFromExam(exam: { gradeConfig: Prisma.JsonValue | null }): GradeRangeInput[] {
  if (!Array.isArray(exam.gradeConfig)) return defaultGradeRanges;
  return exam.gradeConfig
    .filter((item): item is any => typeof item === "object" && item !== null)
    .map((item) => ({
      grade: String(item.grade ?? ""),
      minPercentage: Number(item.minPercentage ?? 0),
      maxPercentage: Number(item.maxPercentage ?? 0),
      gradePoint: Number(item.gradePoint ?? 0),
      remark: typeof item.remark === "string" ? item.remark : null,
      color: typeof item.color === "string" ? item.color : null,
    }))
    .filter((item) => item.grade);
}

export function getUpdatedExamStatus(exam: {
  examDate: Date;
  startTime: string | null;
  endTime: string | null;
  duration: number | null;
  status: string;
}): string {
  if (["CANCELLED", "RESULT_PENDING", "RESULT_PUBLISHED"].includes(exam.status)) {
    return exam.status;
  }

  const now = new Date();
  const examDate = new Date(exam.examDate);
  const year = examDate.getFullYear();
  const month = examDate.getMonth();
  const day = examDate.getDate();

  const parseTime = (timeStr: string | null, defaultHour = 0, defaultMin = 0) => {
    if (!timeStr) return { hour: defaultHour, min: defaultMin };
    const parts = timeStr.trim().split(":");
    const hour = parseInt(parts[0], 10);
    const min = parseInt(parts[1], 10);
    return {
      hour: isNaN(hour) ? defaultHour : hour,
      min: isNaN(min) ? defaultMin : min
    };
  };

  const startParsed = parseTime(exam.startTime, 0, 0);
  const startDateTime = new Date(year, month, day, startParsed.hour, startParsed.min, 0);

  let endDateTime: Date;
  if (exam.endTime) {
    const endParsed = parseTime(exam.endTime, 23, 59);
    endDateTime = new Date(year, month, day, endParsed.hour, endParsed.min, 0);
  } else if (exam.duration) {
    endDateTime = new Date(startDateTime.getTime() + exam.duration * 60 * 1000);
  } else {
    endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);
  }

  if (now.getTime() < startDateTime.getTime()) {
    return "UPCOMING";
  } else if (now.getTime() >= startDateTime.getTime() && now.getTime() < endDateTime.getTime()) {
    return "ONGOING";
  } else {
    return "COMPLETED";
  }
}

export async function syncActiveExamStatuses() {
  const activeExams = await prisma.exam.findMany({
    where: {
      status: { in: ["UPCOMING", "ONGOING"] },
    },
  });

  for (const exam of activeExams) {
    const computedStatus = getUpdatedExamStatus(exam);
    if (computedStatus !== exam.status) {
      await prisma.exam.update({
        where: { id: exam.id },
        data: { status: computedStatus as any },
      });
    }
  }
}

export function buildExamWhere(filters: ExamFilters): Prisma.ExamWhereInput {
  const where: Prisma.ExamWhereInput = {};
  if (filters.instituteId) where.instituteId = filters.instituteId;
  if (filters.status) where.status = filters.status as Prisma.EnumExamStatusFilter["equals"];
  if (filters.type) where.type = filters.type as Prisma.EnumExamTypeFilter["equals"];
  if (filters.batchId) where.batchId = filters.batchId;
  if (filters.subjectId) where.subjectId = filters.subjectId;
  if (filters.fromDate || filters.toDate) {
    where.examDate = {
      ...(filters.fromDate ? { gte: new Date(filters.fromDate) } : {}),
      ...(filters.toDate ? { lte: new Date(filters.toDate) } : {}),
    };
  }
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { code: { contains: filters.search, mode: "insensitive" } },
      { batch: { name: { contains: filters.search, mode: "insensitive" } } },
      { subject: { name: { contains: filters.search, mode: "insensitive" } } },
    ];
  }
  if (filters.standardId) {
    const existingOr = where.OR;
    delete where.OR;
    where.AND = [
      ...(existingOr ? [{ OR: existingOr }] : []),
      { OR: [{ standardId: filters.standardId }, { batch: { standardId: filters.standardId } }] },
    ];
  }
  return where;
}

export async function getExamStats(where: Prisma.ExamWhereInput = {}) {
  await syncActiveExamStatuses();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const [total, upcoming, ongoing, resultPending, published, thisMonth] = await Promise.all([
    prisma.exam.count({ where }),
    prisma.exam.count({ where: { ...where, status: "UPCOMING" } }),
    prisma.exam.count({ where: { ...where, status: "ONGOING" } }),
    prisma.exam.count({ where: { ...where, status: "RESULT_PENDING" } }),
    prisma.exam.count({ where: { ...where, status: "RESULT_PUBLISHED" } }),
    prisma.exam.count({ where: { ...where, examDate: { gte: monthStart, lte: monthEnd } } }),
  ]);
  return { total, upcoming, ongoing, resultPending, published, thisMonth };
}

export async function listExams(filters: ExamFilters) {
  await syncActiveExamStatuses();
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
  const where = buildExamWhere(filters);
  const [exams, total] = await Promise.all([
    prisma.exam.findMany({
      where,
      include: {
        batch: { include: { enrollments: { where: { isActive: true }, select: { id: true } } } },
        subject: true,
        results: true,
      },
      orderBy: [{ examDate: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.exam.count({ where }),
  ]);

  // Check and update exam statuses dynamically based on current time
  for (const exam of exams) {
    const computedStatus = getUpdatedExamStatus(exam);
    if (computedStatus !== exam.status) {
      await prisma.exam.update({
        where: { id: exam.id },
        data: { status: computedStatus as any },
      });
      exam.status = computedStatus as any;
    }
  }

  const stats = await getExamStats(where);

  return {
    exams: exams.map((exam) => ({
      ...exam,
      studentCount: exam.batch.enrollments.length,
      enteredCount: exam.results.filter((result) => result.status !== "PENDING").length,
    })),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    stats,
  };
}

export async function createExam(rawInput: ExamCreateInput & { instituteId?: string }, createdBy: string) {
  const { instituteId, ...rest } = rawInput;
  const input = examCreateSchema.parse(rest);
  const code = input.code?.trim() || (await generateNextExamCode(input.examDate.getFullYear()));
  const [batch, enrollments] = await Promise.all([
    prisma.batch.findUnique({ where: { id: input.batchId }, select: { standardId: true } }),
    prisma.batchEnrollment.findMany({
      where: { batchId: input.batchId, isActive: true },
      select: { studentId: true },
    }),
  ]);

  return prisma.exam.create({
    data: {
      instituteId: instituteId ?? null,
      title: input.title,
      code,
      description: input.description,
      type: input.type,
      batchId: input.batchId,
      subjectId: input.subjectId,
      academicYear: input.academicYear,
      standardId: input.standardId || batch?.standardId || null,
      examDate: input.examDate,
      startTime: input.startTime,
      endTime: input.endTime,
      duration: input.duration,
      totalMarks: input.totalMarks,
      passingMarks: input.passingMarks,
      hasNegativeMarking: input.hasNegativeMarking,
      negativeMarkValue: input.negativeMarkValue,
      gradingSystem: input.gradingSystem,
      gradeConfig: (input.gradeConfig === undefined ? defaultGradeRanges : input.gradeConfig) as any,
      status: input.status,
      createdBy,
      results: {
        create: enrollments.map((enrollment) => ({
          studentId: enrollment.studentId,
          batchId: input.batchId,
          totalMarks: input.totalMarks,
        })),
      },
      questions: {
        create: input.questions.map((question) => ({
          questionNumber: question.questionNumber,
          questionText: question.questionText,
          questionType: question.questionType,
          marks: question.marks,
          negativeMarks: question.negativeMarks,
          optionA: question.optionA,
          optionB: question.optionB,
          optionC: question.optionC,
          optionD: question.optionD,
          correctOption: question.correctOption,
          modelAnswer: question.modelAnswer,
          answerKeyPoints: question.answerKeyPoints,
          topic: question.topic,
          difficulty: question.difficulty,
        })),
      },
    },
    include: { batch: true, subject: true, results: { include: { student: true } }, questions: true },
  });
}

export async function getExamDetail(id: string) {
  const exam = await prisma.exam.findUnique({
    where: { id },
    include: {
      batch: { include: { enrollments: { where: { isActive: true }, include: { student: true } } } },
      subject: true,
      results: { include: { student: true }, orderBy: [{ batchRank: "asc" }, { createdAt: "asc" }] },
      questions: { include: { studentAnswers: true }, orderBy: { questionNumber: "asc" } },
      onlineAttempts: true,
    },
  });
  if (!exam) return null;

  const computedStatus = getUpdatedExamStatus(exam);
  if (computedStatus !== exam.status) {
    await prisma.exam.update({
      where: { id: exam.id },
      data: { status: computedStatus as any },
    });
    exam.status = computedStatus as any;
  }

  const enteredCount = exam.results.filter((result) => result.status !== "PENDING").length;
  const scored = exam.results.filter((result) => !result.isAbsent && result.marksObtained !== null);
  const percentages = scored.map((result) => result.percentage ?? 0);
  const summary = {
    studentCount: exam.batch.enrollments.length,
    enteredCount,
    pendingCount: Math.max(0, exam.batch.enrollments.length - enteredCount),
    highest: percentages.length ? Math.max(...percentages) : 0,
    lowest: percentages.length ? Math.min(...percentages) : 0,
    average: percentages.length ? Number((percentages.reduce((sum, value) => sum + value, 0) / percentages.length).toFixed(2)) : 0,
    passCount: scored.filter((result) => (result.marksObtained ?? 0) >= exam.passingMarks).length,
    failCount: scored.filter((result) => (result.marksObtained ?? 0) < exam.passingMarks).length,
    absentCount: exam.results.filter((result) => result.isAbsent).length,
  };

  return { ...exam, summary };
}

export async function updateExam(id: string, rawInput: ExamUpdateInput) {
  const { questions, ...input } = examUpdateSchema.parse(rawInput);
  return prisma.exam.update({
    where: { id },
    data: {
      ...input,
      gradeConfig: input.gradeConfig === undefined ? undefined : (input.gradeConfig as Prisma.InputJsonValue),
    },
    include: { batch: true, subject: true, results: true, questions: true },
  });
}

export async function deleteExam(id: string) {
  const exam = await prisma.exam.findUnique({ where: { id }, select: { isResultPublished: true } });
  if (!exam) throw new Error("Exam not found");
  if (exam.isResultPublished) throw new Error("Published exams cannot be deleted");
  return prisma.exam.delete({ where: { id } });
}

export async function getMarksEntryData(examId: string) {
  const exam = await getExamDetail(examId);
  if (!exam) return null;
  return exam;
}

export async function submitMarks(examId: string, rawInput: MarksSubmitInput, enteredBy: string) {
  const input = marksSubmitSchema.parse(rawInput);
  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  if (!exam) throw new Error("Exam not found");
  const gradeRanges = getGradeRangesFromExam(exam);

  const operations = input.results.map((entry) => {
    if (!entry.isAbsent && !entry.isDisqualified && (entry.marksObtained ?? 0) > exam.totalMarks) {
      throw new Error("Marks cannot exceed total marks");
    }

    const grade = entry.isAbsent || entry.isDisqualified || entry.marksObtained === null || entry.marksObtained === undefined
      ? null
      : calculateGrade(entry.marksObtained, exam.totalMarks, gradeRanges);

    const status: ResultStatus = input.publishNow ? "PUBLISHED" : "ENTERED";

    return prisma.examResult.update({
      where: { examId_studentId: { examId, studentId: entry.studentId } },
      data: {
        marksObtained: entry.isAbsent || entry.isDisqualified ? null : entry.marksObtained,
        totalMarks: exam.totalMarks,
        percentage: grade?.percentage ?? null,
        grade: grade?.grade ?? null,
        gradePoint: grade?.gradePoint ?? null,
        status,
        isAbsent: entry.isAbsent,
        isDisqualified: entry.isDisqualified,
        disqualifyReason: entry.disqualifyReason,
        teacherRemarks: entry.teacherRemarks,
        strengthAreas: entry.strengthAreas,
        weakAreas: entry.weakAreas,
        enteredBy,
        enteredAt: new Date(),
      },
    });
  });

  await prisma.$transaction(operations);
  if (input.calculateRanks) {
    await calculateBatchRanks(examId, exam.batchId);
    await calculateOverallRanks(examId);
  }

  if (input.publishNow) {
    await publishExamResults(examId, enteredBy);
  } else {
    await prisma.exam.update({ where: { id: examId }, data: { status: "RESULT_PENDING" } });
  }

  return getExamDetail(examId);
}

export async function updateSingleStudentMarks(examId: string, studentId: string, rawInput: MarksSubmitInput["results"][number], enteredBy: string) {
  return submitMarks(examId, { results: [{ ...rawInput, studentId }], calculateRanks: false, publishNow: false, notifyParents: false }, enteredBy);
}

export async function publishExamResults(examId: string, userId: string) {
  await prisma.examResult.updateMany({ where: { examId, status: { in: ["ENTERED", "VERIFIED"] } }, data: { status: "PUBLISHED" } });
  return prisma.exam.update({
    where: { id: examId },
    data: { isResultPublished: true, resultPublishedAt: new Date(), publishedBy: userId, status: "RESULT_PUBLISHED" },
    include: { results: { include: { student: true } }, batch: true, subject: true },
  });
}
