import { prisma } from "@/lib/prisma";

type BackfillDelegate = {
  updateMany?: (args: {
    where: { instituteId: null };
    data: { instituteId: string };
  }) => Promise<unknown>;
};

const INSTITUTE_BACKFILL_MODELS = [
  "session",
  "oTPVerification",
  "activityLog",
  "passwordResetToken",
  "notification",
  "enquiry",
  "followUp",
  "demoClass",
  "dashboardAlert",
  "instituteSettings",
  "academicYear",
  "backupRecord",
  "student",
  "standard",
  "parent",
  "emergencyContact",
  "medicalInfo",
  "studentDocument",
  "siblingLink",
  "attendance",
  "attendanceSession",
  "attendanceAlert",
  "attendanceNotification",
  "feeStructure",
  "feeRecord",
  "feePayment",
  "discount",
  "scholarship",
  "feeReminder",
  "refund",
  "onlinePaymentOrder",
  "announcement",
  "report",
  "reportRun",
  "analyticsSnapshot",
  "studentProgressReport",
  "pTMMeeting",
  "pTMSlot",
  "parentFeedback",
  "teacherPerformanceReport",
  "exam",
  "examResult",
  "examQuestion",
  "studentAnswer",
  "onlineAttempt",
  "gradeConfig",
  "gradeRange",
  "reportCard",
  "performanceAnalysis",
  "studentActivity",
  "teacher",
  "subject",
  "studyMaterial",
  "teacherSubject",
  "teacherStandardSubject",
  "teacherAttendance",
  "teacherLeave",
  "salaryRecord",
  "teacherDocument",
  "teacherPerformance",
  "room",
  "batch",
  "batchEnrollment",
  "timetableSlot",
  "classSession",
  "holiday",
  "academicCalendar",
  "conflictLog",
  "classSchedule",
] as const;

function slugify(value: string) {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  return base || "tuition";
}

export async function createInstituteForAdmin(name: string, email: string) {
  const slugBase = slugify(`${name}-${email.split("@")[0]}`);
  let slug = slugBase;
  let suffix = 1;

  while (await prisma.institute.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${slugBase}-${suffix}`;
  }

  return prisma.institute.create({
    data: {
      name: `${name}'s Tuition`,
      slug,
    },
  });
}

export async function ensureUserInstitute(user: {
  id: string;
  name: string;
  email: string;
  instituteId: string | null;
}) {
  if (user.instituteId) return user.instituteId;

  const institute = await createInstituteForAdmin(user.name, user.email);
  await prisma.institute.update({
    where: { id: institute.id },
    data: { ownerId: user.id },
  });
  await prisma.user.update({
    where: { id: user.id },
    data: { instituteId: institute.id },
  });

  const instituteCount = await prisma.institute.count();
  if (instituteCount === 1) {
    await adoptLegacyRows(institute.id);
  }

  return institute.id;
}

async function adoptLegacyRows(instituteId: string) {
  await prisma.user.updateMany({
    where: { instituteId: null },
    data: { instituteId },
  });

  for (const modelName of INSTITUTE_BACKFILL_MODELS) {
    const delegate = (prisma as unknown as Record<string, BackfillDelegate>)[modelName];
    if (!delegate?.updateMany) continue;

    await delegate.updateMany({
      where: { instituteId: null },
      data: { instituteId },
    });
  }
}

export async function resolvePublicInstituteId() {
  const institutes = await prisma.institute.findMany({
    select: { id: true },
    take: 2,
    orderBy: { createdAt: "asc" },
  });

  if (institutes.length !== 1) {
    return null;
  }

  return institutes[0].id;
}
